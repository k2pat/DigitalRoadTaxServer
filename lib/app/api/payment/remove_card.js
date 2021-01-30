const util = require('@/util');
const auth = require('@app/lib/auth');
const userModel = require('@data/model/user');
const stripe = require('@app/stripe');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
        
        if (!body.payment_method_id && !body.customer_id)
            return util.badRequestResponse(res);
        
        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);

        let params = {
            u_id: u_id,
            get_stripe_customer: true
        }
        const user = await userModel.get(params);
        if (!user) return util.unauthorizedResponse(res);

        if (user.u_stripe_customer.id !== body.customer_id) return util.conflictResponse(res, 'User mismatch', 'NOT_USER');

        await stripe.paymentMethods.detach(body.payment_method_id);
        
        return util.successResponse(res);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}