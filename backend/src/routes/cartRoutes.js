const express = require('express');
const cartController = require('../controllers/cartController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { addItemRules, updateItemRules, itemIdRule } = require('../validations/cartValidation');

const router = express.Router();

router.use(protect);

router.get('/', cartController.getCart);
router.post('/', addItemRules, validate, cartController.addItem);
router.put('/:id', updateItemRules, validate, cartController.updateItem);
router.delete('/:id', itemIdRule, validate, cartController.removeItem);

module.exports = router;
