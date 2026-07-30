const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), v: user.tokenVersion || 0 }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

// Short-lived token issued after a successful password check for an account
// with MFA enabled. It deliberately cannot be used as an access token (it
// carries no `role`, and `protect` only ever signs/verifies real access
// tokens) — it only proves "this request already passed step 1 of login".
function signMfaChallengeToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'mfa_challenge' }, env.jwt.secret, { expiresIn: '5m' });
}

function verifyMfaChallengeToken(token) {
  const decoded = jwt.verify(token, env.jwt.secret);
  if (decoded.type !== 'mfa_challenge') throw new Error('Not an MFA challenge token');
  return decoded;
}

function parseDurationMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * unitMs[match[2]];
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signMfaChallengeToken,
  verifyMfaChallengeToken,
  parseDurationMs,
};
