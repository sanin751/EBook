const BlockedIp = require('../models/BlockedIp');

const AUTO_BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour
const AUTO_BLOCK_THRESHOLD = 3; // distinct rate-limit trips within the window below
const VIOLATION_WINDOW_MS = 60 * 60 * 1000;

// In-memory only — resets on restart, and wouldn't be shared across multiple
// server instances without a store like Redis. Acceptable for this
// coursework's single-instance scope (documented trade-off, same as the
// CAPTCHA store); the persisted BlockedIp record itself is what actually
// enforces the block, this is just the trigger heuristic.
const violations = new Map(); // ip -> { count, windowStart }

async function isBlocked(ip) {
  if (!ip) return false;
  const entry = await BlockedIp.findOne({ ip, expiresAt: { $gt: new Date() } });
  return Boolean(entry);
}

async function blockIp(ip, reason, { ttlMs = AUTO_BLOCK_DURATION_MS, createdBy } = {}) {
  await BlockedIp.findOneAndUpdate(
    { ip },
    { ip, reason, createdBy, expiresAt: new Date(Date.now() + ttlMs) },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function unblockIp(ip) {
  await BlockedIp.deleteOne({ ip });
}

async function listBlocked() {
  return BlockedIp.find({ expiresAt: { $gt: new Date() } }).sort('-createdAt').populate('createdBy', 'name email');
}

// Called from the rate limiter's `handler` whenever a request trips
// authLimiter. Once the same IP trips it 3 times within an hour, escalate
// from "temporarily rate-limited" to "blocked outright" for the next hour.
// Returns the underlying blockIp promise when a block is triggered (so tests
// can await it deterministically instead of guessing at timing) — the real
// caller (the rate limiter's handler) doesn't await this and that's fine,
// the block just lands a moment after the 429 response goes out.
function recordRateLimitViolation(ip) {
  if (!ip) return undefined;
  const now = Date.now();
  const entry = violations.get(ip);

  if (!entry || now - entry.windowStart > VIOLATION_WINDOW_MS) {
    violations.set(ip, { count: 1, windowStart: now });
    return undefined;
  }

  entry.count += 1;
  if (entry.count >= AUTO_BLOCK_THRESHOLD) {
    violations.delete(ip);
    return blockIp(ip, 'Automatic: repeated rate-limit violations').catch(() => {});
  }
  return undefined;
}

module.exports = { isBlocked, blockIp, unblockIp, listBlocked, recordRateLimitViolation };
