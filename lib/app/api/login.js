const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');
const redis = require('@app/redis');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
        
        if (!(body.mobile_num || body.email) || !body.password)
            return util.badRequestResponse(res);
        
        let params = {
            u_mobile_num: body.mobile_num,
            u_email: body.email,
            get_u_vehicles: true,
            get_u_driving_vehicles: true,
            get_roadtax_rate: true,
            get_proof_id: true,
        }
        const user = await userModel.get(params);
        if (!user) return util.unauthorizedResponse(res);
    
        if (! await auth.verifyPassword(body.password, user.u_password))
            return util.unauthorizedResponse(res);
    
        user.u_access_token = await auth.registerAccessToken(user.u_id);
        await redis.set(user.u_id, body.device_token ?? '');
        delete user.u_password;
    
        return util.successResponse(res, user);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}