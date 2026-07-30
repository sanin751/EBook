const { body } = require('express-validator');

const blockIpRules = [
  body('ip').trim().notEmpty().withMessage('IP address is required'),
  body('reason').optional().trim().isLength({ max: 200 }),
];

module.exports = { blockIpRules };
