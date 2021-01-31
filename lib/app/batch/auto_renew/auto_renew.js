require('module-alias/register');

const vehicleModel = require('@data/model/vehicle');
const roadtaxModel = require('@data/model/roadtax');

const firebase = require('firebase-admin');
const { createNodeRedisClient } = require('handy-redis');
const moment = require('moment');

const redis = createNodeRedisClient();

firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
});

async function sendPushNotification(vehicle) {
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
            u_id: vehicle.u_id
        }
        const user = await userModel.get(userParams);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1099,
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
        result = await roadtaxModel.create(roadtaxParams);
        if (result !== true) throw 'Failed to create roadtax';

        return {...vehicle, ...roadtaxParams};
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
        };
        let result = await vehicleModel.get(params);

        let count = 0;
        for (i = 0; i < result.length; i++) {
            renewRoadtax(result[i]).then((vehicle) => {
                if (vehicle !== false)
                sendPushNotification(vehicle).then(() => {
                    count++;
                    if (count == result.length) process.exit(1);
                });
            });
        }
        if (result.length == 0) process.exit(1);

    } catch (e) {
        console.log(e);
    }
}

run();