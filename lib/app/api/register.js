const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');
const makeid = require('@app/lib/makeid');
const stripe = require('@app/stripe');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
    
        if (!(body.name && body.mobile_num && body.password && body.id_num && body.id_type))
            return util.badRequestResponse(res);

        const name = body.name.toUpperCase();
        const id_type = body.id_type.toUpperCase();
        
        const existingId = await userModel.get({
            u_id_num: body.id_num,
            u_id_type: body.id_type,
        });
        if (existingId) return util.conflictResponse(res, 'User with identification number and type combination already exists');

        const existingMobile = await userModel.get({
            u_mobile_num: body.mobile_num,
        });
        if (existingMobile) return util.conflictResponse(res, 'User with mobile number already exists');

        let params = {
            u_name: name,
            u_mobile_num: body.mobile_num,
            u_email: body.email,
            u_password: await auth.hashPassword(body.password),
            u_id_num: body.id_num,
            u_id_type: id_type,
            u_stripe_customer: await stripe.customers.create({name: name}),
            u_driver_tag: makeid(6),
            u_drivers: [],
            u_is_driving: [],
        }
        const success = await userModel.create(params);
        if (!success) throw 'Error: Failed to create user';

        return util.successResponse(res);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}