const { body, param, query } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 150 }),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('price').notEmpty().withMessage('Price is required').isFloat({ min: 0 }).withMessage('Price must be a positive number').toFloat(),
  body('discountPrice').optional().isFloat({ min: 0 }).withMessage('Discount price must be a positive number').toFloat(),
  body('category').notEmpty().withMessage('Category is required').isMongoId().withMessage('Invalid category id'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer').toInt(),
  body('sku').optional().trim(),
  body('author').optional().trim().isLength({ max: 100 }),
  body('publisher').optional().trim().isLength({ max: 100 }),
  body('pages').optional().trim().isLength({ max: 50 }),
  body('isbn').optional().trim().isLength({ max: 100 }),
  body('formats').optional(),
  body('tags').optional(),
];

const updateRules = [
  param('id').isMongoId().withMessage('Invalid product id'),
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('discountPrice').optional().isFloat({ min: 0 }).toFloat(),
  body('category').optional().isMongoId().withMessage('Invalid category id'),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('sku').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('author').optional().trim().isLength({ max: 100 }),
  body('publisher').optional().trim().isLength({ max: 100 }),
  body('pages').optional().trim().isLength({ max: 50 }),
  body('isbn').optional().trim().isLength({ max: 100 }),
  body('formats').optional(),
  body('tags').optional(),
];

const idRule = [param('id').isMongoId().withMessage('Invalid product id')];

const listRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('category').optional().isMongoId().withMessage('Invalid category id'),
  query('search').optional().trim(),
  query('sort').optional().trim(),
  query('inStock').optional().isBoolean().toBoolean(),
  query('format').optional().trim(),
  query('tag').optional().trim(),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).toFloat(),
];

const compareRules = [
  query('ids')
    .notEmpty()
    .withMessage('ids is required')
    .custom((value) => {
      const ids = `${value}`.split(',').map((id) => id.trim());
      if (ids.length < 2 || ids.length > 4) {
        throw new Error('Provide between 2 and 4 product ids to compare');
      }
      if (!ids.every((id) => /^[0-9a-fA-F]{24}$/.test(id))) {
        throw new Error('One or more ids are not valid product ids');
      }
      return true;
    }),
];

module.exports = { createRules, updateRules, idRule, listRules, compareRules };
