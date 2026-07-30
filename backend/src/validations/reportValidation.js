const { query } = require('express-validator');

const ordersReportRules = [
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
];

const productsReportRules = [query('limit').optional().isInt({ min: 1, max: 50 }).toInt()];

module.exports = { ordersReportRules, productsReportRules };
