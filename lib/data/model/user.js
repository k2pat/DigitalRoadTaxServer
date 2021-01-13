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

    const _params = {
        u_id: result.u_id,
    }
    result.u_vehicles = await vehicle.get(_params);
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