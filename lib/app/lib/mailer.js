require('dotenv').config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

async function createTransporter() {
    const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );
  
    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
            reject(err);
            }
            resolve(token);
        });
    });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL,
            accessToken,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN
        }
    });

    return transporter;
}

async function sendEmail(emailOptions) {
    emailOptions.from = process.env.EMAIL;
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
}

module.exports = sendEmail;

// sendEmail({
//     subject: "Road tax expiring",
//     html: "<h1>Road tax expiring</h1><p>Renew your road tax through the Digital Road Tax app</p>",
//     to: "abdhakeem99@gmail.com",
//     from: process.env.EMAIL
// });