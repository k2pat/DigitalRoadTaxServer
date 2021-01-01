const API_PATH = 'http://localhost:9984/api/v1/'

const Orm = require('bigchaindb-orm').default;
const orm = new Orm(API_PATH);

// Define models here
orm.define("user");
orm.define("vehicle");
orm.define("roadtax");

const bip39 = require('bip39')
const seed = bip39.mnemonicToSeedSync('DRT').slice(0,32)
const keypair = new orm.driver.Ed25519Keypair(seed);

module.exports = { orm, keypair };