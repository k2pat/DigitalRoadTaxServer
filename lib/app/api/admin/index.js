const router = require('express').Router();
const path = require('path');

router.get('/add_vehicle', (req, res) => res.sendFile(path.join(__dirname, './add_vehicle.html')));

module.exports = router;