const { body, param } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('parent').optional().isMongoId().withMessage('Invalid parent category id'),
];

const updateRules = [
  param('id').isMongoId().withMessage('Invalid category id'),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('parent').optional().isMongoId().withMessage('Invalid parent category id'),
  body('isActive').optional().isBoolean(),
];

const idRule = [param('id').isMongoId().withMessage('Invalid category id')];

module.exports = { createRules, updateRules, idRule };
