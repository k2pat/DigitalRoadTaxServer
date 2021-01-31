const util = require('@/util');
const transactionModel = require('@data/model/transaction');
const vehicleModel = require('@data/model/vehicle');
const roadtaxModel = require('@data/model/roadtax');
const stripe = require('@app/stripe');
const firebase = require('@app/firebase');
const redis = require('@app/redis');

module.exports = async function (req, res) {
    try {
        const event = req.body ?? {};
    
        if (event.type !== 'payment_intent.succeeded')
            console.log(`Unhandled event type ${event.type}`);
    
        const paymentIntent = event.data.object;
        res.json({received: true});

        let params = {
            tr_payment_intent_id: paymentIntent.id,
        }
        const transaction = await transactionModel.get(params);
        if (!transaction) throw `Transaction for payment intent ${paymentIntent.id} not found`;

        const roadtaxParams = transaction.roadtax;
        result = await roadtaxModel.create(roadtaxParams);
        if (result !== true) throw 'Failed to create roadtax';

        const vehicleParams = transaction.vehicle;
        vehicleParams.ve_auto_renew_payment_method = (vehicleParams.ve_auto_renew === true) ? paymentIntent.payment_method : null;
        result = await vehicleModel.update(vehicleParams);
        if (result.success !== true) throw 'Failed to update vehicle';

        result = /*await*/ transactionModel.update({
            tr_id: transaction.tr_id,
            tr_status: 'SUCCESS',
        });
        // if (result.success !== true) throw 'Failed to update transaction status';

        // const updatedVehicle = await vehicleModel.get({ ve_reg_num: transaction.vehicle.ve_reg_num });

        const registrationToken = await redis.get(transaction.u_id);
        if (!registrationToken) return;
        var message = {
            data: {
                type: 'RENEWAL_SUCCESS'
            },
            token: registrationToken
        };
        response = await firebase.messaging().send(message);
        console.log('Successfully sent message:', response);
    }
    catch (e) {
        console.log(e);
        //util.errorResponse(res);
    }
}