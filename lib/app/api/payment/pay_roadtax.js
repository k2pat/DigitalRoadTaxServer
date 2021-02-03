const util = require('@/util');
const auth = require('@app/lib/auth');
const vehicleModel = require('@data/model/vehicle');
const userModel = require('@data/model/user');
const transactionModel = require('@data/model/transaction');
const moment = require('moment');
const stripe = require('@app/stripe');
const { v1: uuid } = require('uuid');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
        
        if (!(body.reg_num && body.validity_duration && body.expiry_dt && body.roadtax_amount))
            return util.badRequestResponse(res);

        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);
        
        let params = {
            ve_reg_num: body.reg_num,
            get_roadtax_rate: true,
        }
        const vehicle = await vehicleModel.get(params);
        if (!vehicle) return util.conflictResponse(res, `Vehicle ${body.reg_num} not found`, 'VE_NOT_FOUND');

        if (moment(vehicle.rt_expiry_dt).diff(moment(), 'months', true) > 2) return util.conflictResponse(res, 'Renewal too early', 'RENEW_TOO_EARLY');

        if (vehicle.u_id != u_id) return util.conflictResponse(res, 'Vehicle owner mismatch', 'NOT_VE_OWNER');

        const effective_dt = (moment().isBefore(vehicle.rt_expiry_dt)) ? vehicle.rt_expiry_dt : moment().format('YYYY-MM-DD');

        if (body.validity_duration == '1Y') {
            roadtax_amount = vehicle.ve_roadtax_rate;
            expiry_dt = moment(effective_dt).add(1, 'y').format('YYYY-MM-DD');
        } else if (body.validity_duration == '6M') {
            roadtax_amount = Math.round(((vehicle.ve_roadtax_rate * 0.5) + Number.EPSILON) * 100) / 100;
            expiry_dt = moment(effective_dt).add(6, 'M').format('YYYY-MM-DD');
        } else {
            return util.badRequestResponse(res, 'Invalid validity duration');
        }

        const conflicts = {};
        if (roadtax_amount != body.roadtax_amount) conflicts.roadtax_amount = roadtax_amount;
        if (expiry_dt != body.expiry_dt) conflicts.expiry_dt = expiry_dt;

        if (Object.keys(conflicts).length > 0) {
            return util.conflictResponse(res, 'Renewal request updated', 'RENEW_REQ_UPDATED', conflicts);
        }

        let u_params = {
            u_id: u_id,
            get_stripe_customer: true
        }
        const user = await userModel.get(u_params);
        if (!user) return util.unauthorizedResponse(res);
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: roadtax_amount * 100,
            currency: 'myr',
            customer: user.u_stripe_customer.id,
            // capture_method: 'manual'
        });

        let transaction = {
            tr_id: uuid(),
            u_id: u_id,
            device_token: body.device_token ?? null,
            tr_payment_intent_id: paymentIntent.id,
            tr_status: 'PENDING',
            tr_amount: roadtax_amount,
            roadtax: {
                ve_reg_num: vehicle.ve_reg_num,
                rt_expiry_dt: expiry_dt,
                rt_effective_dt: effective_dt,
                rt_validity_duration: body.validity_duration,
            },
            vehicle: {
                ve_id: vehicle.ve_id,
                ve_auto_renew: (body.auto_renew === true) ? true : false,
                ve_auto_renew_duration: (body.auto_renew === true) ? body.validity_duration : null,
            }
        };
        const result = await transactionModel.create(transaction);
        if (result === false) throw 'Failed to create transaction';
        
        return util.successResponse(res, {
            client_secret: paymentIntent.client_secret,
            transaction: transaction
        });
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}