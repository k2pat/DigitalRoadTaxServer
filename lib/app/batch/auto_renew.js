require('module-alias/register');

const vehicleModel = require('@data/model/vehicle');
const roadtaxModel = require('@data/model/roadtax');
const userModel = require('@data/model/user');
const transactionModel = require('@data/model/transaction');
const mailer = require('@app/lib/mailer');

const stripe = require('@app/stripe');
const firebase = require('firebase-admin');
const { createNodeRedisClient } = require('handy-redis');
const moment = require('moment');
const { v1: uuid } = require('uuid');

const redis = createNodeRedisClient();

firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
});

async function sendPushNotification(transaction) {
    try {
        const vehicle = transaction.vehicle;
        if (!vehicle.u_id) return;
        const registrationToken = await redis.get(vehicle.u_id);
        if (!registrationToken) return;
    
        var message = {
            notification: {
              title: 'Digital Road Tax',
              body: `${vehicle.ve_reg_num} was successfully auto-renewed`,
            },
            token: registrationToken
        };
    
        response = await firebase.messaging().send(message);
        console.log('Successfully sent message:', response);
    }
    catch (e) {
        console.log(e);
    }
}

async function sendEmail(transaction, email) {
    try {
        if (email == null || email == '') return;

        const vehicle = transaction.vehicle;
        const tx = transaction.transaction;

        if (vehicle.rt_validity_duration == '6M') validityDuration = '6 months';
        else if (vehicle.rt_validity_duration == '1Y') validityDuration = '1 year';

        let body = `<p>Dear Customer,</p><br>`
        subject = `${vehicle.ve_reg_num} - Auto-renewal of road tax successful`;
        body = body + `
            <p>Your vehicle's road tax has been automatically renewed. Here's your receipt:</p>
            <h3>Transaction Details</h3>
            <table>
            <tr><td><b>Date</b></td><td>${moment(tx.tr_dt).format('D MMMM YYYY, HH:mm:ss')}</td></tr>
            <tr><td><b>Transaction ID</b></td><td>${tx.tr_id}</td></tr>
            <tr><td><b>Payment Amount</b></td><td>RM ${tx.tr_amount.toFixed(2)}</td></tr>
            <tr><td><b>Vehicle Registration No.</b></td><td>${vehicle.ve_reg_num}</td></tr>
            <tr><td><b>Validity Duration</b></td><td>${validityDuration}</td></tr>
            <tr><td><b>Expiry Date</b></td><td>${moment(vehicle.rt_expiry_dt).format('D MMMM YYYY')}</td></tr>
            </table><br><br>
            <p><i>Digital Road Tax</i></p>`;
    
        await mailer({
            subject: subject,
            html: body,
            to: email,
        });
        
        console.log('Successfully sent email');
    }
    catch (e) {
        console.log(e);
    }
}

async function renewRoadtax(vehicle) {
    try {
        const effective_dt = (moment().isBefore(vehicle.rt_expiry_dt)) ? vehicle.rt_expiry_dt : moment().format('YYYY-MM-DD');

        if (vehicle.ve_auto_renew_duration == '1Y') {
            roadtax_amount = vehicle.ve_roadtax_rate;
            expiry_dt = moment(effective_dt).add(1, 'y').format('YYYY-MM-DD');
        } else if (ve_auto_renew_duration == '6M') {
            roadtax_amount = Math.round(((vehicle.ve_roadtax_rate * 0.5) + Number.EPSILON) * 100) / 100;
            expiry_dt = moment(effective_dt).add(6, 'M').format('YYYY-MM-DD');
        } else {
            return false;
        }

        const userParams = {
            u_id: vehicle.u_id,
            get_stripe_customer: true,
        }
        const user = await userModel.get(userParams);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: roadtax_amount * 100,
            currency: 'myr',
            customer: user.u_stripe_customer.id,
            payment_method: vehicle.ve_auto_renew_payment_method,
            off_session: true,
            confirm: true,
        });

        const roadtaxParams = {
            ve_reg_num: vehicle.ve_reg_num,
            rt_expiry_dt: expiry_dt,
            rt_effective_dt: effective_dt,
            rt_validity_duration: vehicle.ve_auto_renew_duration
        }
        // result = await roadtaxModel.create(roadtaxParams);
        // if (result !== true) throw 'Failed to create roadtax';

        let transaction = {
            tr_id: uuid(),
            u_id: vehicle.u_id,
            tr_dt: moment().format('YYYY-MM-DDTHH:mm:ss'),
            tr_payment_intent_id: paymentIntent.id,
            tr_status: 'PENDING',
            tr_amount: roadtax_amount,
            tr_auto_renew: true,
            roadtax: roadtaxParams,
        };
        result = await transactionModel.create(transaction);
        if (result === false) throw 'Failed to create transaction';

        return {
            vehicle: {...vehicle, ...roadtaxParams},
            transaction: transaction
        };
    }
    catch (e) {
        console.log(e);
        return false;
    }
}

async function run() {
    try {
        let params = {
            ve_auto_renew: true,
            where_days_left: 1,
            get_roadtax_rate: true,
        };
        let result = await vehicleModel.get(params);

        ownerEmail = {};
        for (i = 0; i < result.length; i++) {
            vehicle = result[i];
            if (!(vehicle.u_id in ownerEmail)) {
                ownerEmail[vehicle.u_id] = (await userModel.get({u_id: vehicle.u_id})).u_email ?? null;
            }
        }

        await Promise.all(result.map(async vehicle => {
            const transaction = await renewRoadtax(vehicle);
            if (transaction !== false) {
                await Promise.all([
                    sendPushNotification(transaction),
                    sendEmail(transaction, ownerEmail[vehicle.u_id]),
                ]);
            }
        }));

        process.exit();

    } catch (e) {
        console.log(e);
    }
}

run();