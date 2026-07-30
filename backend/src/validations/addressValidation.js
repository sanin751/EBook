const { body, param } = require('express-validator');

const createRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').optional().trim(),
  body('postalCode').optional().trim(),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('isDefault').optional().isBoolean().toBoolean(),
];

const updateRules = [
  param('id').isMongoId().withMessage('Invalid address id'),
  body('fullName').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
  body('street').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('state').optional().trim(),
  body('postalCode').optional().trim(),
  body('country').optional().trim().notEmpty(),
  body('isDefault').optional().isBoolean().toBoolean(),
];

const idRule = [param('id').isMongoId().withMessage('Invalid address id')];

module.exports = { createRules, updateRules, idRule };
