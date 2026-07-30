const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const blockedIpService = require('../services/blockedIpService');
const env = require('../config/env');

// Runs before the rate limiters so a blocked IP is rejected outright rather
// than merely throttled. Skipped in tests (mongodb-memory-server + the
// volume of requests the suite fires would otherwise make this a liability
// rather than a safeguard).
module.exports = catchAsync(async (req, res, next) => {
  if (env.nodeEnv === 'test') return next();
  if (await blockedIpService.isBlocked(req.ip)) {
    return next(ApiError.forbidden('Your IP address has been temporarily blocked due to suspicious activity'));
  }
  next();
});
