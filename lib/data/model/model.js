const bdb = require('@data/bdb_orm');

async function create(model, params) {
    const asset = await bdb.orm.models[model].create({
        keypair: bdb.keypair,
        data: params
    });
    console.log(asset.id);

    return true;
}

async function update(model, params, id) {
    const assets = (await bdb.orm.models[model].retrieve(id))
        .reduce((acc, asset) => {
            acc[asset.id] = asset;
            return acc;
        }, {});

    const asset = assets[id];
    if (!asset) return {
        success: false,
        errorMsg: `${model} with id: ${id} does not exist`
    };

    const updatedData = { ...asset.data, ...params };

    const updatedAsset = await asset.append({
        toPublicKey: bdb.keypair.publicKey,
        keypair: bdb.keypair,
        data: updatedData
    });
    console.log(updatedAsset.id);

    return { success: true };
}

module.exports = { create, update };