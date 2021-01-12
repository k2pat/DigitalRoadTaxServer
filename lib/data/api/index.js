const router = require('express').Router();

router.use('/user', require('./user'));
router.use('/vehicle', require('./vehicle'));
router.use('/roadtax', require('./roadtax'));

// router.use('/officer', require('./officer.js'));
// router.use('/operation', require('./operation.js'));
// router.use('/validation_result', require('./validation_result.js'));

module.exports = router;