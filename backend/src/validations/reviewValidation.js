const { body, param } = require('express-validator');

const createRules = [
  body('productId').notEmpty().withMessage('productId is required').isMongoId().withMessage('Invalid productId'),
  body('rating').notEmpty().withMessage('Rating is required').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  body('comment').optional().trim().isLength({ max: 1000 }),
];

const productIdRule = [param('productId').isMongoId().withMessage('Invalid product id')];

const idRule = [param('id').isMongoId().withMessage('Invalid review id')];

module.exports = { createRules, productIdRule, idRule };
