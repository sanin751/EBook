const SecurityEvent = require('../models/SecurityEvent');
const logger = require('../utils/logger');

// Awaited by callers so an event is guaranteed persisted before the response
// is sent (an audit trail that can silently lose entries isn't much of an
// audit trail) — but failure-isolated: a logging failure is swallowed here
// and must never break the request that triggered it.
async function record({ type, user, email, ip, userAgent, meta }) {
  try {
    await SecurityEvent.create({ type, user: user || undefined, email, ip, userAgent, meta });
  } catch (err) {
    logger.error(`Failed to record security event "${type}": ${err.message}`);
  }
}

async function list({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    SecurityEvent.find({}).sort('-createdAt').skip(skip).limit(limit).populate('user', 'name email'),
    SecurityEvent.countDocuments({}),
  ]);
  return { events, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

module.exports = { record, list };
