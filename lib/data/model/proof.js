const bdb = require('@data/bdb_orm');
const model = require('./model');
const jsonata = require('jsonata');
const { v4: uuidv4 } = require('uuid')

async function get(params) {
    mapByVehicle = false;

    if (params.u_id && params.ve_reg_num) {
        if (Array.isArray(params.ve_reg_num)) {
            expression = jsonata("proof[ve_reg_num in $ve_reg_num and u_id = $u_id]");
            mapByVehicle = true;
        }
        else {
            expression = jsonata("proof[ve_reg_num = $ve_reg_num and u_id = $u_id][0]");
        }
        bindings = {
            u_id: params.u_id,
            ve_reg_num: params.ve_reg_num,
        };
    } else if (params.ve_proof_id) {
        expression = jsonata("proof[ve_proof_id = $ve_proof_id][0]");
        bindings = { ve_proof_id: params.ve_proof_id };
    }
    else {
        return false;
    }

    const data = {
        proof: (await bdb.orm.models.proof.retrieve()).flatMap((asset) => {
            if (asset.data.status === 'BURNED') return [];
            let ret = { pr_id: asset.id }
            return [{ ...asset.data, ...ret }];
        })
    };
    
    var result = expression.evaluate(data, bindings);
    if (!result) return '';

    if (mapByVehicle === true) {
        if (!Array.isArray(result)) result = [result];
        ret = {}
        result.forEach(proof => {
            ret[proof.ve_reg_num] = proof;
        });
        result = ret;
    }

    return result;
}

async function create(params) {
    if (!params.u_id || !params.ve_reg_num) return false;

    params.ve_proof_id = uuidv4();

    return model.create('proof', params);
}

async function update(params) {
    if (!params.pr_id) return false;

    const pr_id = params.pr_id;
    delete params.pr_id;

    return model.update('proof', params, pr_id);
}

async function burn(params) {
    if (!params.pr_id) return false;

    const pr_id = params.pr_id;

    return model.burn('proof', pr_id);
}

module.exports = { get, create, update, burn };