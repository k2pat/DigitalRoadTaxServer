const bdb = require('../bdb_orm.js');
const jsonata = require('jsonata');
const { v4: uuidv4 } = require('uuid');

const roadtax = require('./roadtax.js');

async function get(params) {
    if (params.ve_reg_num) {
        expression = jsonata("vehicle[ve_reg_num = $ve_reg_num][0]");
        bindings = { ve_reg_num: params.ve_reg_num };
        multipleResult = false;

    } else if (params.ve_proof_id) {
        expression = jsonata("vehicle[ve_proof_id = $ve_proof_id][0]");
        bindings = { ve_proof_id: params.ve_proof_id };
        multipleResult = false;

    } else if (params.u_uuid) {
        expression = jsonata("vehicle[u_uuid = $u_uuid]");
        bindings = { u_uuid: params.u_uuid };
        multipleResult = true;

    } else if (params.u_id && params.u_id_type) {
        expression = jsonata("vehicle[u_id = $u_id and u_id_type = $u_id_type]");
        bindings = {
            u_id: params.u_id,
            u_id_type: params.u_id_type 
        };
        multipleResult = true;

    } else if (params.get_all === true) {
        multipleResult = true;

    } else {
        return false;
    }

    const data = {
        vehicle: (await bdb.orm.models.vehicle.retrieve()).map(asset => asset.data)
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

    const asset = await bdb.orm.models.vehicle.create({
        keypair: bdb.keypair,
        data: params
    });
    console.log(asset.id);

    return true;
}

module.exports = { get, create };