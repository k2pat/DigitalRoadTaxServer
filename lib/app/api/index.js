const router = require('express').Router();

// Mobile app endpoints
router.post('/register', (req, res) => require('./register')(req, res));
router.post('/login', (req, res) => require('./login')(req, res));
router.post('/sync', (req, res) => require('./sync')(req, res));
router.post('/renew_roadtax', (req, res) => require('./renew_roadtax')(req, res));
router.post('/update_auto_renew', (req, res) => require('./update_auto_renew')(req, res));
router.post('/sync_vehicles', (req, res) => require('./sync_vehicles')(req, res));

router.use('/payment', require('./payment'));

// Service endpoints
router.post('/add_vehicle', (req, res) => require('./add_vehicle')(req, res));

// Admin interface
router.use('/admin', require('./admin'));

module.exports = router;