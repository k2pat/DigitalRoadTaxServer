const bdb = require('@data/bdb_orm');
const model = require('./model');
const jsonata = require('jsonata');

const vehicle = require('./vehicle');

async function get(params) {
    if (params.u_mobile_num) {
        expression = jsonata("user[u_mobile_num = $u_mobile_num][0]");
        bindings = { u_mobile_num: params.u_mobile_num };

    } else if (params.u_email) {
        expression = jsonata("user[u_email = $u_email][0]");
        bindings = { u_email: params.u_email };

    } else if (params.u_id) {
        expression = jsonata("user[u_id = $u_id][0]");
        bindings = { u_id: params.u_id };

    } else if (params.u_id_num && params.u_id_type) {
        expression = jsonata("user[u_id_num = $u_id_num and u_id_type = $u_id_type][0]");
        bindings = { u_id_num: params.u_id_num, u_id_type: params.u_id_type };
        
    } else if (params.u_driver_tag) {
        expression = jsonata("user[u_driver_tag = $u_driver_tag][0]");
        bindings = { u_driver_tag: params.u_driver_tag };

    } else {
        return false;
    }
    const data = {
        user: (await bdb.orm.models.user.retrieve()).map(asset => {
            let ret = { u_id: asset.id }
            return { ...asset.data, ...ret };
        })
    };
    const result = expression.evaluate(data, bindings);
    if (!result) return null;

    if (params.get_u_vehicles === true) {
        const _params = {
            u_id: result.u_id,
            get_roadtax_rate: params.get_roadtax_rate ?? false,
            get_proof_id: params.get_proof_id === true ? result.u_id : false,
        }
        result.u_vehicles = await vehicle.get(_params);

        if (params.get_auto_renew_payment_methods === true) {
            result.u_auto_renew_payment_methods = (result.u_vehicles == null) ? null : result.u_vehicles.reduce((acc, vehicle) => {
                if (vehicle.ve_auto_renew === true) {
                    if (!acc[vehicle.ve_auto_renew_payment_method]) acc[vehicle.ve_auto_renew_payment_method] = [];
                    acc[vehicle.ve_auto_renew_payment_method].push(vehicle.ve_reg_num);
                }
                return acc;
            }, {});
        }
    }

    if (params.get_u_driving_vehicles === true) {
        const _params = {
            ve_reg_num: result.u_is_driving ?? [],
            get_proof_id: params.get_proof_id === true ? result.u_id : false,
        }
        result.u_driving_vehicles = await vehicle.get(_params);
    }

    if (params.get_stripe_customer !== true) {
        delete result.u_stripe_customer;
    }

    return result;
}

async function create(params) {
    if (!params.u_mobile_num || !params.u_password) return false;

    const asset = await bdb.orm.models.user.create({
        keypair: bdb.keypair,
        data: params
    });
    console.log(asset.id);

    return true;
}

async function update(params) {
    if (!params.u_id) return false;

    const u_id = params.u_id;
    delete params.u_id;

    return model.update('user', params, u_id);
}

module.exports = { get, create, update };