const util = require('@/util');
const userModel = require('@data/model/user');
const vehicleModel = require('@data/model/vehicle');
const proofModel = require('@data/model/proof');
const auth = require('@app/lib/auth');

module.exports = async function (req, res) {
    try {
        const body = req.body ?? {};
    
        if (!(body.driver_tags && Array.isArray(body.driver_tags) && body.reg_num))
            return util.badRequestResponse(res);

        const u_id = await auth.verifyAccessToken(req);
        if (!u_id) return util.unauthorizedResponse(res);

        const user = await userModel.get({ u_id: u_id });
        if (!user) throw 'Failed to find user';

        let vehicleParams = {
            ve_reg_num: body.reg_num,
        }
        const vehicle = await vehicleModel.get(vehicleParams);
        if (!vehicle) return util.conflictResponse(res, `Vehicle ${body.reg_num} not found`, 'VE_NOT_FOUND');
        if (vehicle.u_id != u_id) return util.conflictResponse(res, 'Vehicle owner mismatch', 'NOT_VE_OWNER');

        let drivers = user.u_drivers ?? [];

        for (driver_tag of body.driver_tags) {
            const driver = await userModel.get({ u_driver_tag: driver_tag });
            if (!driver) throw 'Failed to find driver';

            success = await proofModel.create({
                u_id: driver.u_id,
                ve_reg_num: vehicle.ve_reg_num
            });
            if (!success) throw 'Error: Failed to create driver digital proof';

            let drivingVehicles = driver.u_is_driving ?? [];
            drivingVehicles.push(body.reg_num);

            let driverParams = {
                u_id: driver.u_id,
                u_is_driving: drivingVehicles,
            }
            result = await userModel.update(driverParams);
            if (!result.success) throw 'Error: Failed to update driver';

            drivers.some((savedDriver, i, drivers) => {
                if (savedDriver.u_driver_tag == driver.u_driver_tag) {
                    if (!Array.isArray(savedDriver.dr_vehicles)) savedDriver.dr_vehicles = [];

                    savedDriver.dr_vehicles.push(body.reg_num);

                    drivers[i] = savedDriver;
                    return true;
                }
            });
        }

        driver_tags_remove = body.driver_tags_remove && Array.isArray(body.driver_tags_remove) ? body.driver_tags_remove : [];
        for (driver_tag of body.driver_tags_remove) {
            const driver = await userModel.get({ u_driver_tag: driver_tag });
            if (!driver) throw 'Failed to find driver';

            const proof = await proofModel.get({
                u_id: driver.u_id,
                ve_reg_num: vehicle.ve_reg_num,
            });
            result = await proofModel.burn(proof);
            if (!result.success) throw 'Error: Failed to burn proof';

            let drivingVehicles = driver.u_is_driving ?? [];
            for (i = 0; i < drivingVehicles.length; i++) {
                if (drivingVehicles[i] == body.reg_num) {
                    drivingVehicles.splice(i, 1);
                }
            };

            let driverParams = {
                u_id: driver.u_id,
                u_is_driving: drivingVehicles,
            }
            result = await userModel.update(driverParams);
            if (!result.success) throw 'Error: Failed to update driver';

            drivers.some((savedDriver, i, drivers) => {
                if (savedDriver.u_driver_tag == driver.u_driver_tag) {
                    if (!Array.isArray(savedDriver.dr_vehicles)) savedDriver.dr_vehicles = [];

                    for (j = 0; j < savedDriver.dr_vehicles.length; j++) {
                        if (savedDriver.dr_vehicles[j] == body.reg_num) {
                            savedDriver.dr_vehicles.splice(j, 1);
                        }
                    };

                    drivers[i] = savedDriver;
                    return true;
                }
            });
        }
    
        let params = {
            u_id: u_id,
            u_drivers: drivers,
        }
        result = await userModel.update(params);
        if (!result.success) throw 'Error: Failed to update user';

        return util.successResponse(res, {drivers: drivers});
    }
    catch (e) {
        console.log(e);
        util.errorResponse(res);
    }
}