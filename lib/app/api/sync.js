const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
        
        if (!body.access_token)
            return util.badRequestResponse(res);

        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);
        
        let params = {
            u_id: u_id,
            get_u_vehicles: true,
            get_roadtax_rate: true,
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