const { body, param } = require('express-validator');

const addItemRules = [
  body('productId').notEmpty().withMessage('productId is required').isMongoId().withMessage('Invalid productId'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1').toInt(),
  body('selectedFormat').optional().trim().isLength({ max: 50 }),
  body('variantLabel').optional().trim().isLength({ max: 50 }),
  body('giftMessage').optional().trim().isLength({ max: 200 }),
];

const updateItemRules = [
  param('id').isMongoId().withMessage('Invalid cart item id'),
  body('quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be at least 1').toInt(),
];

const itemIdRule = [param('id').isMongoId().withMessage('Invalid cart item id')];

module.exports = { addItemRules, updateItemRules, itemIdRule };
