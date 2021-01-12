const util = require('@/util');
const roadtax = require('@data/model/roadtax');

async function _getRoadtax(req, res) {
    try {
        const body = req.body ?? {};
        const params = body.params ?? {};

        if (!util.authenticate(body.key)) return util.unauthorizedResponse(res);

        const result = await roadtax.get(params);
        if (result === false) return util.badRequestResponse(res);

        util.successResponse(res, result);

    } catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}

async function _createRoadtax(req, res) {
    try {
        const body = req.body ?? {};
        const params = body.params ?? {};

        if (!util.authenticate(body.key)) return util.unauthorizedResponse(res);

        const result = await roadtax.create(params);
        if (result === false) return util.badRequestResponse(res);

        util.successResponse(res);

    } catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}

const router = require('express').Router();

router.post('/get', (req, res) => _getRoadtax(req, res));
router.post('/create', (req, res) => _createRoadtax(req, res));

module.exports = router;