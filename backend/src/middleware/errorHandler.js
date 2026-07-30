const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return ApiError.badRequest('Validation failed', details);
  }

  // Mongoose bad ObjectId cast
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return ApiError.conflict(field ? `${field} already exists` : 'Duplicate value');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token expired');
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    return ApiError.badRequest(`File upload error: ${err.message}`);
  }

  return new ApiError(err.statusCode || 500, err.message || 'Internal server error');
}

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const error = normalizeError(err);

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(err);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
