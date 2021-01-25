const util = require('@/util');
const auth = require('@app/lib/auth');
const vehicleModel = require('@data/model/vehicle');
const roadtaxModel = require('@data/model/roadtax');
const moment = require('moment');
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
        
        const roadtaxParams = {
            ve_reg_num: vehicle.ve_reg_num,
            rt_expiry_dt: expiry_dt,
            rt_effective_dt: effective_dt,
            rt_validity_duration: body.validity_duration
        }
        result = await roadtaxModel.create(roadtaxParams);
        if (result !== true) throw 'Failed to create roadtax';

        result = await vehicleModel.update({
            ve_id: vehicle.ve_id,
            ve_auto_renew: (body.auto_renew === true) ? true : false,
            ve_auto_renew_duration: (body.auto_renew === true) ? body.validity_duration : null,
        });
        if (result.success !== true) throw 'Failed to update vehicle';

        const updatedVehicle = await vehicleModel.get({ ve_reg_num: vehicle.ve_reg_num });
        
        const transaction = {
            tr_id: uuid(),
            rt_id: updatedVehicle['rt_id'],
            tr_amount: roadtax_amount,
            tr_dt: moment().format('YYYY-MM-DDTHH:mm:ss'),
        }

        const ret = {
            roadtax: updatedVehicle,
            receipt: {...transaction, ...updatedVehicle}
        }

        return util.successResponse(res, ret);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}