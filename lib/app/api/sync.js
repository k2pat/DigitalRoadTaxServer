const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
        
        if (!body.access_token)
            return util.badRequestResponse(res);

        const u_uuid = await auth.verifyAccessToken(req);
        if (!u_uuid) return util.unauthorizedResponse(res);
        
        let params = {
            u_uuid: u_uuid,
        }
        const user = await userModel.get(params);
        if (!user) return util.unauthorizedResponse(res);

        delete user.u_password;
    
        return util.successResponse(res, user);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}