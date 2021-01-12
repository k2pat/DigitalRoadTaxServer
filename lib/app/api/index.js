const router = require('express').Router();

router.post('/register', (req, res) => require('./register')(req, res));
router.post('/login', (req, res) => require('./login')(req, res));
router.post('/sync', (req, res) => require('./sync')(req, res));

module.exports = router;