const firebase = require('firebase-admin');

firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
});

module.exports = firebase;