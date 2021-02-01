const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');
const stripe = require('@app/stripe');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
    
        if (!(body.mobile_num && body.password && body.id_num && body.id_type))
            return util.badRequestResponse(res);
        
        // TODO: add checking for existing account with same email/mobile num/id
    
        let params = {
            u_mobile_num: body.mobile_num,
            u_email: body.email,
            u_password: await auth.hashPassword(body.password),
            u_id_num: body.id_num,
            u_id_type: body.id_type.toUpperCase(),
            u_stripe_customer: await stripe.customers.create(),
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