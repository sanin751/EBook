const express = require('express');
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { createOrderRules, idRule, updateStatusRules } = require('../validations/orderValidation');

const router = express.Router();

router.use(protect);

router.post('/', createOrderRules, validate, orderController.create);
router.get('/', orderController.list);
router.get('/admin/all', restrictTo('admin'), orderController.adminList);
router.patch('/:id/status', restrictTo('admin'), updateStatusRules, validate, orderController.updateStatus);
router.get('/:id', idRule, validate, orderController.getById);

module.exports = router;
