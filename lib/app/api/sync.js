const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');
const redis = require('@app/redis');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
        
        // if (!body.access_token)
        //     return util.badRequestResponse(res);

        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);
        
        let params = {
            u_id: u_id,
            get_u_vehicles: true,
            get_u_driving_vehicles: true,
            get_roadtax_rate: true,
            get_proof_id: true,
        }
        const user = await userModel.get(params);
        if (!user) return util.unauthorizedResponse(res);

        await redis.set(user.u_id, body.device_token ?? '');

        delete user.u_password;
    
        return util.successResponse(res, user);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}