const dataAPI = require('./data/api');
const util = require('./util.js');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', dataAPI);

app.use((req, res) => {
    if (!req.route)
        util.notFoundResponse(res);
})

app.listen(8001, () => {
    console.log("DRT Blockchain API server listening on port 8001!")
});