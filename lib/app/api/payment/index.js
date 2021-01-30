const router = require('express').Router();

router.post('/setup_intent', (req, res) => require('./setup_intent')(req, res));
router.post('/get_cards', (req, res) => require('./get_cards')(req, res));
router.post('/remove_card', (req, res) => require('./remove_card')(req, res));
router.post('/pay_roadtax', (req, res) => require('./pay_roadtax')(req, res));
router.post('/webhook', (req, res) => require('./webhook')(req, res));

module.exports = router;