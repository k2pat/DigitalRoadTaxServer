const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');
const redis = require('@app/redis');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
        
        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);
        
        let params = {
            u_id: u_id,
            get_u_driving_vehicles: true,
            get_proof_id: true,
        }
        const user = await userModel.get(params);
        if (!user) throw 'Failed to find user';
    
        return util.successResponse(res, {u_driving_vehicles: user.u_driving_vehicles});
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}