const util = require('@/util');
const vehicleModel = require('@data/model/vehicle');
const roadtaxModel = require('@data/model/roadtax');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');
const redis = require('@app/redis');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};console.log(body);
        
        if (!(body.ve_reg_num && body.u_id_num && body.u_id_type && body.ve_region && body.ve_make && body.ve_model && body.ve_engine_capacity && body.ve_type))
            return util.badRequestResponse(res); // TODO: ve_is_electric

        let userParams = {
            u_id_num: body.u_id_num,
            u_id_type: body.u_id_type,
        }
        const user = await userModel.get(userParams);
        console.log(user);

        let vehicleParams = body;
        vehicleParams.ve_engine_capacity = parseInt(body.ve_engine_capacity);
        vehicleParams.ve_proof_id = '';

        if (user) {
            vehicleParams.u_id = user.u_id;
        }

        const result = await vehicleModel.create(vehicleParams);

        const _result = await roadtaxModel.create({
            ve_reg_num: body.ve_reg_num,
            rt_expiry_dt: '2021-01-15',
        });

        return util.successResponse(res, result);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}