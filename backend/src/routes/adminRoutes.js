const express = require('express');
const reportController = require('../controllers/reportController');
const securityController = require('../controllers/securityController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { blockIpRules } = require('../validations/securityValidation');

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/dashboard', reportController.dashboard);

router.get('/security/events', securityController.listEvents);
router.get('/security/blocked-ips', securityController.listBlockedIps);
router.post('/security/blocked-ips', blockIpRules, validate, securityController.blockIp);
router.delete('/security/blocked-ips/:ip', securityController.unblockIp);

module.exports = router;
