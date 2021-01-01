const bdb = require('../bdb_orm.js');
const jsonata = require('jsonata');
const { v4: uuidv4 } = require('uuid')

async function get(params) {
    if (!params.ve_reg_num) return false;

    const data = {
        roadtax: (await bdb.orm.models.roadtax.retrieve()).map(asset => asset.data)
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
    
    params.rt_id = uuidv4();

    const asset = await bdb.orm.models.roadtax.create({
        keypair: bdb.keypair,
        data: params
    });
    console.log(asset.id);

    return true;
}

module.exports = { get, create };