const bdb = require('@data/bdb_orm');
const model = require('./model');
const jsonata = require('jsonata');

async function get(params) {
    if (!params.ve_reg_num) return false;

    const data = {
        roadtax: (await bdb.orm.models.roadtax.retrieve()).map(asset => {
            let ret = { rt_id: asset.id }
            return { ...asset.data, ...ret };
        })
    };

    const expression = jsonata("roadtax[ve_reg_num = $ve_reg_num]^(> rt_expiry_dt)[0]");

    if (Array.isArray(params.ve_reg_num)) {
        result = {};
        const vehicles = [ ...new Set(params.ve_reg_num) ];
        vehicles.forEach(ve_reg_num => {
            res = expression.evaluate(data, {
                ve_reg_num: ve_reg_num
            });
            if (res) result[ve_reg_num] = res;
        });
        if (Object.keys(result).length == 0) return null;
        return result;
        
    } else {
        return expression.evaluate(data, {
            ve_reg_num: params.ve_reg_num
        });
    }
}

async function create(params) {
    if (!params.ve_reg_num || !params.rt_expiry_dt) return false; //TODO: effective_dt ???

    return model.create('roadtax', params);
}

async function update(params) {
    if (!params.rt_id) return false;

    const rt_id = params.rt_id;
    delete params.rt_id;

    return model.update('roadtax', params, rt_id);
}

module.exports = { get, create, update };