const util = require('@/util');
const auth = require('@app/lib/auth');
const vehicleModel = require('@data/model/vehicle');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};console.log(body);
        
        if (!(body.reg_num && body.auto_renew !== undefined && body.auto_renew_duration !== undefined && body.payment_method))
            return util.badRequestResponse(res);

        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);
        
        let params = {
            ve_reg_num: body.reg_num,
            get_roadtax_rate: true,
        }
        const vehicle = await vehicleModel.get(params);
        if (!vehicle) return util.conflictResponse(res, `Vehicle ${body.reg_num} not found`, 'VE_NOT_FOUND');

        if (vehicle.u_id != u_id) return util.conflictResponse(res, 'Vehicle owner mismatch', 'NOT_VE_OWNER');

        if (body.auto_renew === true && !['1Y', '6M'].includes(body.auto_renew_duration)) {
            return util.badRequestResponse(res, 'Invalid validity duration');
        }

        const updateParams = {
            ve_id: vehicle.ve_id,
            ve_auto_renew: (body.auto_renew === true) ? true : false,
            ve_auto_renew_duration: (body.auto_renew === true) ? body.auto_renew_duration : null,
            ve_auto_renew_payment_method: (body.auto_renew === true) ? body.payment_method : null,
        };
        result = await vehicleModel.update(updateParams);
        if (result.success !== true) throw 'Failed to update vehicle';

        updatedVehicle = { ...vehicle, ...updateParams };

        return util.successResponse(res, updatedVehicle);
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}