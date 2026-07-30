const express = require('express');
const reviewController = require('../controllers/reviewController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createRules, productIdRule, idRule } = require('../validations/reviewValidation');

const router = express.Router();

router.get('/:productId', productIdRule, validate, reviewController.listForProduct);
router.post('/', protect, createRules, validate, reviewController.create);
router.delete('/:id', protect, idRule, validate, reviewController.remove);

module.exports = router;
