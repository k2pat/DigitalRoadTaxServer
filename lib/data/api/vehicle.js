const util = require('../util.js');
const vehicle = require('../model/vehicle.js');

async function _getVehicle(req, res) {
    try {
        const body = req.body ?? {};
        const params = body.params ?? {};

        if (!util.authenticate(body.key)) return util.unauthorizedResponse(res);

        const result = await vehicle.get(params);
        if (result === false) return util.badRequestResponse(res);
        
        util.successResponse(res, result);

    } catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}

async function _createVehicle(req, res) {
    try {
        const body = req.body ?? {};
        const params = body.params ?? {};

        if (!util.authenticate(body.key)) return util.unauthorizedResponse(res);

        const result = await vehicle.create(params);
        if (result === false) return util.badRequestResponse(res);
        
        util.successResponse(res);

    } catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}

const router = require('express').Router();

router.post('/get', (req, res) => _getVehicle(req, res));
router.post('/create', (req, res) => _createVehicle(req, res));

module.exports = router;