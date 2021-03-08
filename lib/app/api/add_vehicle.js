const util = require('@/util');
const vehicleModel = require('@data/model/vehicle');
const roadtaxModel = require('@data/model/roadtax');
const userModel = require('@data/model/user');
const proofModel = require('@data/model/proof');
const auth = require('@app/lib/auth');
const redis = require('@app/redis');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
        
        if (!(body.ve_reg_num && body.u_id_num && body.u_id_type && body.ve_region && body.ve_make && body.ve_model && body.ve_engine_capacity && body.ve_type))
            return util.badRequestResponse(res); // TODO: ve_is_electric

        let userParams = {
            u_id_num: body.u_id_num,
            u_id_type: body.u_id_type,
        }
        const user = await userModel.get(userParams);
        if (!user) throw 'Failed to get user'; 

        let vehicleParams = body;
        vehicleParams.ve_engine_capacity = parseInt(body.ve_engine_capacity);
        vehicleParams.ve_is_electric = body.ve_is_electric === 'Y' ? true : false;

        if (user) {
            vehicleParams.u_id = user.u_id;
        }

        const vehicleExists = await vehicleModel.get(vehicleParams);
        if (vehicleExists) return util.conflictResponse(res, `Vehicle ${vehicleParams.ve_reg_num} already exists`)

        const result = await vehicleModel.create(vehicleParams);
        if (!result) throw 'Failed to create vehicle'; 

        const _result = await roadtaxModel.create({
            ve_reg_num: body.ve_reg_num,
            rt_expiry_dt: '2021-02-22',
        });
        if (!_result) throw 'Failed to create roadtax'; 

        let proofParams = {
            u_id: user.u_id,
            ve_reg_num: body.ve_reg_num,
        };
        const proofResult = await proofModel.create(proofParams);
        if (!proofResult) throw 'Failed to create digital proof'; 

        return util.successResponse(res);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}