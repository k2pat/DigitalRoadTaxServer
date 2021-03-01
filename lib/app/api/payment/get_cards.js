const util = require('@/util');
const auth = require('@app/lib/auth');
const userModel = require('@data/model/user');
const stripe = require('@app/stripe');

module.exports = async function (req, res) {
    try {
        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);

        let params = {
            u_id: u_id,
            get_stripe_customer: true,
            get_u_vehicles: true,
            get_auto_renew_payment_methods: true
        }
        const user = await userModel.get(params);console.log(u_id);
        if (!user) throw 'Failed to find user';

        let cards = await stripe.paymentMethods.list({
            customer: user.u_stripe_customer.id,
            type: 'card',
        });
        
        return util.successResponse(res, {
            cards: cards.data,
            auto_renew_payment_methods: user.u_auto_renew_payment_methods ?? {},
        });
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}