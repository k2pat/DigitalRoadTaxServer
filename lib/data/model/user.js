const bdb = require('@/data/bdb_orm');
const jsonata = require('jsonata');
const { v4: uuidv4 } = require('uuid');

const vehicle = require('./vehicle');

async function get(params) {
    if (params.u_mobile_num) {
        expression = jsonata("user[u_mobile_num = $u_mobile_num][0]");
        bindings = { u_mobile_num: params.u_mobile_num };

    } else if (params.u_email) {
        expression = jsonata("user[u_email = $u_email][0]");
        bindings = { u_email: params.u_email };

    } else if (params.u_uuid) {
        expression = jsonata("user[u_uuid = $u_uuid][0]");
        bindings = { u_uuid: params.u_uuid };
        
    } else {
        return false;
    }
    const data = {
        user: (await bdb.orm.models.user.retrieve()).map(asset => asset.data)
    };
    const result = expression.evaluate(data, bindings);
    if (!result) return null;

    const _params = {
        u_uuid: result.u_uuid,
    }
    result.u_vehicles = await vehicle.get(_params);
    return result;
}

async function create(params) {
    if (!params.u_mobile_num || !params.u_password) return false;

    params.u_uuid = uuidv4();

    const asset = await bdb.orm.models.user.create({
        keypair: bdb.keypair,
        data: params
    });
    console.log(asset.id);

    return true;
}

module.exports = { get, create };