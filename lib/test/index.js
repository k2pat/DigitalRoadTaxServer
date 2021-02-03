const router = require('express').Router();
const redis = require('@app/redis');
const util = require('@/util');

router.post('/shutdown', (req, res) => {
    process.exit(1);
});

router.post('/test_num', async (req, res) => {
    let testNum = await redis.get('test') ?? 10;
    util.successResponse(res, {
        test_num: testNum
    });
    testNum++;
    await redis.set('test', testNum);
});

module.exports = router;