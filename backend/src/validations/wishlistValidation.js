const { body, param } = require('express-validator');

const addRules = [
  body('productId').notEmpty().withMessage('productId is required').isMongoId().withMessage('Invalid productId'),
];

const productIdParamRule = [param('productId').isMongoId().withMessage('Invalid product id')];

const moveToCartRules = [
  param('productId').isMongoId().withMessage('Invalid product id'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1').toInt(),
];

module.exports = { addRules, productIdParamRule, moveToCartRules };
