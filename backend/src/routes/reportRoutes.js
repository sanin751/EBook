const express = require('express');
const reportController = require('../controllers/reportController');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { ordersReportRules, productsReportRules } = require('../validations/reportValidation');

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/orders', ordersReportRules, validate, reportController.ordersReport);
router.get('/products', productsReportRules, validate, reportController.productsReport);

module.exports = router;
