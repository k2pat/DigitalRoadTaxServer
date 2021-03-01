const util = require('@/util');
const userModel = require('@data/model/user');
const auth = require('@app/lib/auth');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
    
        if (!(body.driver_tag && body.nickname))
            return util.badRequestResponse(res);

        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);

        const driver = await userModel.get({ u_driver_tag: body.driver_tag });
        if (!driver) return util.conflictResponse(res, `Driver tag does not exist`);

        const user = await userModel.get({ u_id: u_id });
        if (!user) throw 'Failed to find user';

        let drivers = user.u_drivers ?? [];
        let driverPrevAdded = false;
        drivers.some((savedDriver, i, drivers) => {
            if (savedDriver.u_driver_tag == driver.u_driver_tag) {
                if (!Array.isArray(savedDriver.dr_vehicles)) savedDriver.dr_vehicles = [];

                if (body.reg_num) savedDriver.dr_vehicles.push(body.reg_num);

                drivers[i] = savedDriver;
                driverPrevAdded = true;
                return true;
            }
        });

        if (driverPrevAdded === false) {
            const vehicles = (body.reg_num) ? [body.reg_num] : [];
            drivers.push({
                u_driver_tag: body.driver_tag,
                dr_nickname: body.nickname,
                dr_vehicles: vehicles,
            });
        }
    
        let params = {
            u_id: u_id,
            u_drivers: drivers,
        }
        result = await userModel.update(params);
        if (!result.success) throw 'Error: Failed to update user';

        let drivingVehicles = driver.u_is_driving ?? [];
        if (body.reg_num) drivingVehicles.push(body.reg_num);

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