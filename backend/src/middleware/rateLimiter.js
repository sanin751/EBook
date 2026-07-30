const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const blockedIpService = require('../services/blockedIpService');

const skipInTest = () => env.nodeEnv === 'test';

const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Repeated trips of this limiter escalate an IP from "rate-limited" to
// "blocked" for an hour (see blockedIpService.recordRateLimitViolation) —
// the rate limiter itself only ever throttles, it never permanently blocks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: 'Too many attempts, please try again later' },
  handler: (req, res, next, options) => {
    if (!skipInTest()) blockedIpService.recordRateLimitViolation(req.ip);
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = { apiLimiter, authLimiter };
