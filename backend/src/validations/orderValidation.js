const { body, param } = require('express-validator');

const createOrderRules = [
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Phone is required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').optional().trim(),
  body('shippingAddress.postalCode').optional().trim(),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
];

const idRule = [param('id').isMongoId().withMessage('Invalid order id')];

const updateStatusRules = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];

module.exports = { createOrderRules, idRule, updateStatusRules };
