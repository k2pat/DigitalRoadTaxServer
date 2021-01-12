require('module-alias/register');

const appAPI = require('@app/api');
const dataAPI = require('@data/api');
const util = require('@/util');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/app', appAPI);

app.use('/data', dataAPI);

app.use((req, res) => {
    if (!req.route)
        util.notFoundResponse(res);
})

app.listen(8001, () => {
    console.log("DRT Blockchain API server listening on port 8001!")
});