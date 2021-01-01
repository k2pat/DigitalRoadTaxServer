const router = require('express').Router();

router.use('/user', require('./user.js'));
router.use('/vehicle', require('./vehicle.js'));
router.use('/roadtax', require('./roadtax.js'));

// router.use('/officer', require('./officer.js'));
// router.use('/operation', require('./operation.js'));
// router.use('/validation_result', require('./validation_result.js'));

module.exports = router;