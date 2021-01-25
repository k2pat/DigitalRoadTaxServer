const firebase = require('firebase-admin');
const { createNodeRedisClient } = require('handy-redis');
const axios = require('axios').default;
const moment = require('moment');

const redis = createNodeRedisClient();

firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
});

async function sendPushNotification(vehicle) {
    if (!vehicle.u_id) return;
    const registrationToken = await redis.get(vehicle.u_id);
    if (!registrationToken) return;

    const daysLeft = moment(vehicle.rt_expiry_dt).diff(moment(), 'days', true);
    if (daysLeft > 0) {
        title = 'Road tax expiring';
        body = vehicle.ve_reg_num + ' expires in ' + Math.ceil(daysLeft) + ' days';

    } else {
        title = 'Road tax expired'
        body = vehicle.ve_reg_num + ' has expired';
    }

    var message = {
        notification: {
          title: 'Digital Road Tax',
          body: body,
        },
        token: registrationToken
    };

    response = await firebase.messaging().send(message);
    console.log('Successfully sent message:', response);
}

async function run() {
    try {
        var response = await axios.post('http://localhost:8001/data/vehicle/get', {
            get_all: true,
            where_days_left: 14,
        })
        var result = response.data;

        var count = 0;
        for (i = 0; i < result.length; i++) {
            sendPushNotification(result[i]).then(() => {
                count++;
                if (count == result.length) process.exit(1);
            });
        }
        if (result.length == 0) process.exit(1);

    } catch (e) {
        console.log(e);
    }
}

run();