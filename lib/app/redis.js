const { createNodeRedisClient } = require('handy-redis');
const redis = createNodeRedisClient();

module.exports = redis;