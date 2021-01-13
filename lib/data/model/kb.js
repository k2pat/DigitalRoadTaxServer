const bdb = require('@data/bdb_orm');
const model = require('./model');
const jsonata = require('jsonata');

async function get(params) {
    if (params.kb_name) {
        const data = {
            kb: (await bdb.orm.models.kb.retrieve()).map(asset => {
                let ret = { kb_id: asset.id }
                return { ...asset.data, ...ret };
            })
        };
    
        if (Array.isArray(params.kb_name)) {
            const expression = jsonata("kb[kb_name in $kb_name]{kb_name : kb_rule}");
            return expression.evaluate(data, {
                kb_name: params.kb_name
            });
        }
        else {
            const expression = jsonata("kb[kb_name = $kb_name][0].kb_rule");
            return expression.evaluate(data, {
                kb_name: params.kb_name
            });
        }
    }
    else if (params.get_list === true) {
        return (await bdb.orm.models.kb.retrieve()).map(asset => {
            return {
                kb_name: asset.data.kb_name,
                kb_id: asset.id
            }
        })
    }
}

async function create(params) {
    if (!params.kb_name || !params.kb_rule) return false;

    return model.create('kb', params);
}

async function update(params) {
    if (!params.kb_id) return false;

    const kb_id = params.kb_id;
    delete params.kb_id;

    return model.update('kb', params, kb_id);
}

module.exports = { get, create, update };