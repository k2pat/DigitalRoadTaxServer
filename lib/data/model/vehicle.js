const bdb = require('@data/bdb_orm');
const model = require('./model');
const jsonata = require('jsonata');

const roadtax = require('./roadtax');

async function get(params) {
    if (params.ve_reg_num) {
        expression = jsonata("vehicle[ve_reg_num = $ve_reg_num][0]");
        bindings = { ve_reg_num: params.ve_reg_num };
        multipleResult = false;

    } else if (params.ve_proof_id) {
        expression = jsonata("vehicle[ve_proof_id = $ve_proof_id][0]");
        bindings = { ve_proof_id: params.ve_proof_id };
        multipleResult = false;

    } else if (params.u_id) {
        expression = jsonata("vehicle[u_id = $u_id]");
        bindings = { u_id: params.u_id };
        multipleResult = true;

    } else if (params.u_id_num && params.u_id_type) {
        expression = jsonata("vehicle[u_id_num = $u_id_num and u_id_type = $u_id_type]");
        bindings = {
            u_id_num: params.u_id_num,
            u_id_type: params.u_id_type 
        };
        multipleResult = true;

    } else if (params.get_all === true) {
        multipleResult = true;

    } else {
        return false;
    }

    const data = {
        vehicle: (await bdb.orm.models.vehicle.retrieve()).map(asset => {
            let ret = { ve_id: asset.id }
            return { ...asset.data, ...ret };
        })
    };
    if (params.get_all !== true) {
        var result = expression.evaluate(data, bindings);
        if (!result) return null;
    } else {
        var result = data.vehicle;
    }

    if (Array.isArray(result)) {
        const vehicles = result.map(vehicle => vehicle.ve_reg_num);
        const _params = {
            ve_reg_num: vehicles,
        };
        const roadtaxResult = await roadtax.get(_params);
        result.forEach((vehicle, i, result) => {
            vehicle = { ...vehicle, ...roadtaxResult[vehicle.ve_reg_num] };
            result[i] = vehicle;
        });

    } else {
        const _params = {
            ve_reg_num: result.ve_reg_num,
        };
        var result = { ...result, ...(await roadtax.get(_params)) };
        if (multipleResult === true) result = [ result ];
    }

    if (params.where_days_left && Number.isInteger(params.where_days_left)) {
        const data = {
            vehicle: result
        };
        const expression = jsonata("vehicle[$moment(rt_expiry_dt).diff($moment(), 'days') < $days_left and rt_expiry_dt >= $moment().format('YYYY-MM-DD')]");
        result = expression.evaluate(data, {
            days_left: params.where_days_left,
            moment: require('moment'),
        });
        if (result && !Array.isArray(result)) result = [result];
    }

    return result;
}

async function create(params) {
    //if (!params.ve_reg_num || !params.rt_expiry_dt) return false;

    return model.create('vehicle', params);
}

async function update(params) {
    if (!params.ve_id) return false;

    const ve_id = params.ve_id;
    delete params.ve_id;

    return model.update('vehicle', params, ve_id);
}

module.exports = { get, create, update };