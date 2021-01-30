require('module-alias/register');

const appAPI = require('@app/api');
const dataAPI = require('@data/api');
const util = require('@/util');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(express.static(__dirname, { dotfiles: 'allow' } ));

app.use('/app', appAPI);

app.use('/data', dataAPI);

app.use((req, res) => {
    if (!req.route)
        util.notFoundResponse(res);
})

const http = require('http');
const httpServer = http.createServer(app);

httpServer.listen(8002, () => {
	console.log('DRT Blockchain API HTTP server listening on port 8002!');
});

const fs = require('fs');
const https = require('https');
const httpsServer = https.createServer({
    key: fs.readFileSync('/home/ketupat/bacme/k2pat.ddns.net/k2pat.ddns.net.key'),
    cert: fs.readFileSync('/home/ketupat/bacme/k2pat.ddns.net/k2pat.ddns.net.crt'),
    // ca: fs.readFileSync('/home/ketupat/bacme/k2pat.ddns.net/k2pat.ddns.net.csr')
}, app);

httpsServer.listen(8001, () => {
    console.log("DRT Blockchain API HTTPS server listening on port 8001!")
});