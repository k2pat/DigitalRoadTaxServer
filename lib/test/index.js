const router = require('express').Router();

router.post('/shutdown', (req, res) => {
    process.exit(1);
});

module.exports = router;