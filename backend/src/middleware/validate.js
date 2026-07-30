const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((err) => ({ field: err.path, message: err.msg }));
  next(ApiError.badRequest('Validation failed', details));
};
