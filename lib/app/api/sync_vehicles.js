const util = require('@/util');
const vehicleModel = require('@data/model/vehicle');
const auth = require('@app/lib/auth');

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
            get_roadtax_rate: true,
            get_proof_id: u_id,
        }
        const vehicles = await vehicleModel.get(params);
    
        return util.successResponse(res, { u_vehicles: vehicles });
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}