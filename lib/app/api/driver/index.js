const router = require('express').Router();

router.post('/add_driver', (req, res) => require('./add_driver')(req, res));
router.post('/update_drivers', (req, res) => require('./update_drivers')(req, res));
router.post('/sync_driving_vehicles', (req, res) => require('./sync_driving_vehicles')(req, res));

module.exports = router;