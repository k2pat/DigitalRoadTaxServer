const util = require('@/util');

async function handleRequest(req, res, func) {
    try {
        const params = req.body ?? {};

        if (!util.authenticate(params.key)) return util.unauthorizedResponse(res);

        const result = await func(params);
        if (result === false) return util.badRequestResponse(res);

        util.successResponse(res, result);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}

const router = require('express').Router();

// router.use('/user', require('./user'));
// router.use('/vehicle', require('./vehicle'));
// router.use('/roadtax', require('./roadtax'));

const userModel = require('@data/model/user');
router.post('/user/get', (req, res) => handleRequest(req, res, userModel.get));
router.post('/user/create', (req, res) => handleRequest(req, res, userModel.create));
router.post('/user/update', (req, res) => handleRequest(req, res, userModel.update));

const vehicleModel = require('@data/model/vehicle');
router.post('/vehicle/get', (req, res) => handleRequest(req, res, vehicleModel.get));
router.post('/vehicle/create', (req, res) => handleRequest(req, res, vehicleModel.create));
router.post('/vehicle/update', (req, res) => handleRequest(req, res, vehicleModel.update));

const roadtaxModel = require('@data/model/roadtax');
router.use('/roadtax/get', (req, res) => handleRequest(req, res, roadtaxModel.get));
router.use('/roadtax/create', (req, res) => handleRequest(req, res, roadtaxModel.create));
router.post('/roadtax/update', (req, res) => handleRequest(req, res, roadtaxModel.update));

const kbModel = require('@data/model/kb');
router.use('/kb/get', (req, res) => handleRequest(req, res, kbModel.get));
router.use('/kb/create', (req, res) => handleRequest(req, res, kbModel.create));
router.post('/kb/update', (req, res) => handleRequest(req, res, kbModel.update));

module.exports = router;