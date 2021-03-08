const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
    
        if (!(body.driver_tag))
            return util.badRequestResponse(res);

        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);
        
        const user = await userModel.get({ u_id: u_id });
        if (!user) throw 'Failed to find user';

        let drivers = user.u_drivers ?? [];
        let vehiclesToRemove = [];
        for (i = 0; i < drivers.length; i++) {
            if (drivers[i].u_driver_tag == body.driver_tag) {
                vehiclesToRemove = drivers[i].dr_vehicles ?? [];
                drivers.splice(i, 1);
            }
        };

        let params = {
            u_id: u_id,
            u_drivers: drivers,
        }
        result = await userModel.update(params);
        if (!result.success) throw 'Error: Failed to update user';

        const driver = await userModel.get({ u_driver_tag: body.driver_tag });
        if (!driver) return util.conflictResponse(res, `Driver tag does not exist`);

        let drivingVehicles = driver.u_is_driving ?? [];
        drivingVehicles = drivingVehicles.filter(vehicle => !vehiclesToRemove.includes(vehicle));

        let driverParams = {
            u_id: driver.u_id,
            u_is_driving: drivingVehicles,
        }
        result = await userModel.update(driverParams);
        if (!result.success) throw 'Error: Failed to update driver';

        return util.successResponse(res, {drivers: drivers});
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}