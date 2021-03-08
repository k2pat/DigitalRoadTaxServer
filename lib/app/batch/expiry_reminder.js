require('module-alias/register');

const firebase = require('firebase-admin');
const { createNodeRedisClient } = require('handy-redis');
const moment = require('moment');

const vehicleModel = require('@data/model/vehicle');
const userModel = require('@data/model/user');
const mailer = require('@app/lib/mailer');

const redis = createNodeRedisClient();

firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
});

function calcDaysLeft(vehicle) {
    return Math.ceil(moment(vehicle.rt_expiry_dt).diff(moment(), 'days', true));
}

async function sendPushNotification(vehicle) {
    try {
        if (!vehicle.u_id) return;
        const registrationToken = await redis.get(vehicle.u_id);
        if (!registrationToken) return;
    
        const daysLeft = calcDaysLeft(vehicle);
        if (daysLeft > 0) {
            title = 'Road tax expiring';
            body = vehicle.ve_reg_num + ' expires in ' + daysLeft +  (daysLeft == 1 ? ' day' : ' days');
    
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
    catch (e) {
        console.log(e);
    }
}

function genEmailVehicleDetails(vehicle) {
    return `<b>${vehicle.ve_reg_num} ${vehicle.ve_make} ${vehicle.ve_model}</b><br>`;
}

async function sendEmail(vehicle, email) {
    try {
        if (email == null || email == '') return;
    
        const daysLeft = calcDaysLeft(vehicle);

        let body = `<p>Dear Customer,</p><br>`;
        if (daysLeft > 0) {
            subject = `${vehicle.ve_reg_num} - Road tax expiring in ${calcDaysLeft(vehicle)} ${(daysLeft == 1 ? ' day' : ' days')}`;
            body = body + `
                <p>Your vehicle's road tax is expiring in ${calcDaysLeft(vehicle)} ${(daysLeft == 1 ? ' day' : ' days')}:</p>
                ${genEmailVehicleDetails(vehicle)}
                <b>Expires on ${moment(vehicle.rt_expiry_dt).format('MMMM Do YYYY')}</b><br>`;
        } else {
            subject = `${vehicle.ve_reg_num} - Road tax expired`;
            body = body + `
                <p>Your vehicle's road tax has expired}.</p>
                ${genEmailVehicleDetails(vehicle)}
                <b>Expired on ${moment(vehicle.rt_expiry_dt).format('MMMM Do YYYY')}</b><br>`;
        }
        body = body + `
            <p>Don't forget to renew your road tax!</p><br>
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

async function run() {
    try {
        var result = await vehicleModel.get({
            get_all: true,
            where_days_left: 14,
        })

        ownerEmail = {};
        for (i = 0; i < result.length; i++) {
            vehicle = result[i];
            if (!(vehicle.u_id in ownerEmail)) {
                ownerEmail[vehicle.u_id] = (await userModel.get({u_id: vehicle.u_id})).u_email ?? null;
            }
        }

        await Promise.all(result.map(async vehicle => {
            await Promise.all([
                sendPushNotification(vehicle),
                sendEmail(vehicle, ownerEmail[vehicle.u_id]),
            ]);
        }));

        process.exit();

    } catch (e) {
        console.log(e);
    }
}

run();