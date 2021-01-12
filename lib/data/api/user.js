const util = require('@/util');
const user = require('@data/model/user');

async function _getUser(req, res) {
    try {
        const body = req.body ?? {};
        const params = body.params ?? {};

        if (!util.authenticate(body.key)) return util.unauthorizedResponse(res);

        const result = await user.get(params);
        if (result === false) return util.badRequestResponse(res);
        
        util.successResponse(res, result);

    } catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}

async function _createUser(req, res) {
    try {
        const body = req.body ?? {};
        const params = body.params ?? {};

        if (!util.authenticate(body.key)) return util.unauthorizedResponse(res);

        const result = await user.create(params);
        if (result === false) return util.badRequestResponse(res);

        util.successResponse(res);

    } catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}

const router = require('express').Router();

router.post('/get', (req, res) => _getUser(req, res));
router.post('/create', (req, res) => _createUser(req, res));

module.exports = router;