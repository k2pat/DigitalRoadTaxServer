const bdb = require('@data/bdb_orm');
const model = require('./model');
const jsonata = require('jsonata');
const moment = require('moment');

async function get(params) {
    if (!params.tr_payment_intent_id) return false;

    const data = {
        transaction: (await bdb.orm.models.transaction.retrieve()).map(asset => {
            let ret = { tr_id: asset.id }
            return { ...asset.data, ...ret };
        })
    };

    const expression = jsonata("transaction[tr_payment_intent_id = $tr_payment_intent_id][0]");
    return expression.evaluate(data, {
        tr_payment_intent_id: params.tr_payment_intent_id
    });
}

async function create(params) {
    if (!params.tr_payment_intent_id) return false;

    params.tr_dt = moment().format('YYYY-MM-DDTHH:mm:ss');

    return model.create('transaction', params);
}

async function update(params) {
    if (!params.tr_id) return false;

    const tr_id = params.tr_id;
    delete params.tr_id;

    return model.update('transaction', params, tr_id);
}

module.exports = { get, create, update };