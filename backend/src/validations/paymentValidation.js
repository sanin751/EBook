const { body } = require('express-validator');

const createIntentRules = [
  body('orderId').notEmpty().withMessage('orderId is required').isMongoId().withMessage('Invalid orderId'),
];

module.exports = { createIntentRules };
