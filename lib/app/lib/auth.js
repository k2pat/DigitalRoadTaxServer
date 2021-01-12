const redis = require('@app/redis');
const bcrypt = require('bcrypt');
const SHA512 = require('crypto-js/sha512');

const SALT_ROUNDS = 10;

module.exports = { hashPassword, verifyPassword, registerAccessToken, verifyAccessToken };

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

async function registerAccessToken(u_uuid) {
    const accessToken = SHA512(u_uuid + Date.now()).toString();
    await redis.set(accessToken, u_uuid);
    return accessToken;
}

async function verifyAccessToken(req) {
    const body = req.body ?? {};
    const accessToken = body.access_token ?? null;
    if (accessToken == null) return false;

    const u_uuid = await redis.get(accessToken);
    return u_uuid;
}