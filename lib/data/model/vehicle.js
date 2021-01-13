const bdb = require('@data/bdb_orm');
const model = require('./model');
const jsonata = require('jsonata');

const roadtax = require('./roadtax');
const kb = require('./kb');
const { json } = require('express');

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
    if (!Array.isArray(result)) result = [result];

    // Get roadtax
    const vehicles = result.map(vehicle => vehicle.ve_reg_num);
    const _params = {
        ve_reg_num: vehicles,
    };
    const roadtaxResult = await roadtax.get(_params);
    result.forEach((vehicle, i, result) => {
        vehicle = { ...vehicle, ...roadtaxResult[vehicle.ve_reg_num] };
        result[i] = vehicle;
    });

    // Filter by days left
    if ((params.where_days_left || params.where_days_left === 0) && Number.isInteger(params.where_days_left)) {
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

    // Get roadtax rate
    if (params.get_roadtax_rate) {
        const _params = {
            kb_name: ['roadtax_rate', 'roadtax_rate_electric'],
        };
        const kbRules = await kb.get(_params);
        result.forEach((vehicle, i, result) => {
            let data;
            if (!vehicle.ve_is_electric) {
                data = { roadtax_rate: kbRules['roadtax_rate'] };
                match = "and region = $region";
            }
            else {
                data = { roadtax_rate: kbRules['roadtax_rate_electric'] };
                match = "";
            }
            const expression = jsonata(`roadtax_rate[type = $type ${match} and capacity_lower_limit <= $capacity and (capacity_upper_limit != null ? capacity_upper_limit >= $capacity : true)][0]`);
            const roadtaxClass = expression.evaluate(data, {
                type: vehicle.ve_type,
                region: vehicle.ve_region,
                capacity: vehicle.ve_engine_capacity
            });
            if (!roadtaxClass) throw `Roadtax rate class not found for ${vehicle.ve_reg_num}`;
            if (roadtaxClass.capacity_lower_limit == null || !roadtaxClass.base_rate == null || !roadtaxClass.progressive_rate == null) throw `Roadtax rate class faulty for ${vehicle.ve_reg_num}`;

            roadtaxRate = roadtaxClass.base_rate + (roadtaxClass.progressive_rate * (vehicle.ve_engine_capacity - (roadtaxClass.capacity_lower_limit - 1)));
            
            vehicle.ve_roadtax_rate = roadtaxRate;
            result[i] = vehicle;
        });
    }

    // Format return
    if (multipleResult === true) {
        if (result && !Array.isArray(result)) result = [result];
        return result ?? [];
    }
    else if (multipleResult === false) {
        if (result && Array.isArray(result)) result = result[0];
        return result ?? null;
    }
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