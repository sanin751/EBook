const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signMfaChallengeToken,
  verifyMfaChallengeToken,
} = require('../utils/token');
const { sendPasswordResetEmail, sendMagicLinkEmail } = require('../utils/email');
const mfaService = require('./mfaService');
const captchaService = require('./captchaService');
const securityEventService = require('./securityEventService');

const CAPTCHA_FAILURE_THRESHOLD = 3;

function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

async function register({ name, email, password, captchaId, captchaText }, context = {}) {
  if (!captchaService.verify(captchaId, captchaText)) {
    throw ApiError.badRequest('Incorrect captcha answer', { captchaRequired: true });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  await securityEventService.record({ type: 'register', user: user._id, email, ...context });
  return { user, ...issueTokens(user) };
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

async function registerFailedLogin(user) {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    user.failedLoginAttempts = 0;
  }
  await user.save({ validateBeforeSave: false });
}

async function login({ email, password, captchaId, captchaText }, context = {}) {
  const user = await User.findOne({ email }).select('+password');

  if (user?.isLocked()) {
    await securityEventService.record({ type: 'login_blocked_locked', user: user._id, email, ...context });
    throw ApiError.locked('Account temporarily locked due to too many failed attempts', {
      retryAfterSeconds: Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000),
    });
  }

  // Progressive CAPTCHA: only demanded once an account has shown signs of a
  // credential-guessing attempt, not on every login (keeps normal logins
  // frictionless while still stopping automated brute-force after a few tries).
  if (user && user.failedLoginAttempts >= CAPTCHA_FAILURE_THRESHOLD) {
    if (!captchaService.verify(captchaId, captchaText)) {
      throw ApiError.badRequest('Incorrect captcha answer', { captchaRequired: true });
    }
  }

  if (!user || !(await user.comparePassword(password))) {
    if (user) await registerFailedLogin(user);
    await securityEventService.record({ type: 'login_failure', user: user?._id, email, ...context });
    throw ApiError.unauthorized('Incorrect email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }

  if (user.mfaEnabled) {
    await securityEventService.record({ type: 'login_mfa_challenge_issued', user: user._id, email, ...context });
    return { mfaRequired: true, mfaChallengeToken: signMfaChallengeToken(user) };
  }

  await securityEventService.record({ type: 'login_success', user: user._id, email, ...context });
  return { user, ...issueTokens(user) };
}

async function forgotPassword(email, resetUrlBase, context = {}) {
  const user = await User.findOne({ email });
  // Do not reveal whether the email exists.
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${resetUrlBase}?token=${rawToken}`;
  try {
    await sendPasswordResetEmail(user.email, resetUrl);
    await securityEventService.record({ type: 'password_reset_requested', user: user._id, email, ...context });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.internal('Failed to send password reset email');
  }
}

async function resetPassword(rawToken, newPassword, context = {}) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordHistory');

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired');
  }

  if (await user.isPasswordReused(newPassword)) {
    throw ApiError.badRequest('You cannot reuse a recent password');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion += 1;
  await user.save();
  await securityEventService.record({ type: 'password_reset_completed', user: user._id, email: user.email, ...context });
}

// Passwordless login: a signed, single-use, 10-minute magic link emailed to
// the account, as an alternative to a password. Doesn't bypass MFA — an
// MFA-enabled account still has to complete the TOTP/backup-code challenge
// after the link is consumed, same as a password-based login would.
async function requestPasswordlessLogin(email, magicUrlBase, context = {}) {
  const user = await User.findOne({ email });
  // Do not reveal whether the email exists.
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordlessToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordlessTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  const magicUrl = `${magicUrlBase}?token=${rawToken}`;
  await sendMagicLinkEmail(user.email, magicUrl);
  await securityEventService.record({ type: 'passwordless_requested', user: user._id, email, ...context });
}

async function verifyPasswordlessLogin(rawToken, context = {}) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    passwordlessToken: hashedToken,
    passwordlessTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('This login link is invalid or has expired');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  user.passwordlessToken = undefined;
  user.passwordlessTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  if (user.mfaEnabled) {
    await securityEventService.record({ type: 'login_mfa_challenge_issued', user: user._id, email: user.email, ...context });
    return { mfaRequired: true, mfaChallengeToken: signMfaChallengeToken(user) };
  }

  await securityEventService.record({ type: 'login_success', user: user._id, email: user.email, meta: { via: 'passwordless' }, ...context });
  return { user, ...issueTokens(user) };
}

async function updateProfile(userId, { name }) {
  const user = await User.findByIdAndUpdate(userId, { name }, { returnDocument: 'after', runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function changePassword(userId, currentPassword, newPassword, context = {}) {
  const user = await User.findById(userId).select('+password +passwordHistory');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  if (await user.isPasswordReused(newPassword)) {
    throw ApiError.badRequest('You cannot reuse a recent password');
  }

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();
  await securityEventService.record({ type: 'password_changed', user: user._id, email: user.email, ...context });
}

// Invalidates every outstanding refresh token for this user (this session's
// included) — the client only needs to forget its own access token/cookie,
// but bumping tokenVersion is what actually revokes refresh tokens server-side.
async function logout(userId, context = {}) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  await securityEventService.record({ type: 'logout', user: userId, ...context });
}

async function setupMfa(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.mfaEnabled) throw ApiError.badRequest('MFA is already enabled');

  const secret = mfaService.generateSecret();
  user.mfaSecret = mfaService.encryptSecret(secret);
  await user.save({ validateBeforeSave: false });

  const otpauthUrl = mfaService.keyUri(user.email, secret);
  const qrCodeDataUrl = await mfaService.qrCodeDataUrl(otpauthUrl);
  return { qrCodeDataUrl, manualEntryKey: secret };
}

async function confirmMfaSetup(userId, code, context = {}) {
  const user = await User.findById(userId).select('+mfaSecret');
  if (!user || !user.mfaSecret) throw ApiError.badRequest('MFA setup has not been started');

  const secret = mfaService.decryptSecret(user.mfaSecret);
  if (!mfaService.verifyToken(secret, code)) {
    throw ApiError.badRequest('Invalid authentication code');
  }

  const backupCodes = mfaService.generateBackupCodes();
  user.mfaBackupCodes = await mfaService.hashBackupCodes(backupCodes);
  user.mfaEnabled = true;
  await user.save({ validateBeforeSave: false });
  await securityEventService.record({ type: 'mfa_enabled', user: user._id, email: user.email, ...context });

  return { backupCodes };
}

async function disableMfa(userId, currentPassword, code, context = {}) {
  const user = await User.findById(userId).select('+password +mfaSecret +mfaBackupCodes');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Current password is incorrect');
  }
  if (!user.mfaEnabled) throw ApiError.badRequest('MFA is not enabled');

  const secret = mfaService.decryptSecret(user.mfaSecret);
  const validCode = mfaService.verifyToken(secret, code) || (await mfaService.consumeBackupCode(user, code));
  if (!validCode) throw ApiError.unauthorized('Invalid authentication code');

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  user.mfaBackupCodes = [];
  await user.save({ validateBeforeSave: false });
  await securityEventService.record({ type: 'mfa_disabled', user: user._id, email: user.email, ...context });
}

async function verifyMfaLogin(mfaChallengeToken, code, context = {}) {
  let decoded;
  try {
    decoded = verifyMfaChallengeToken(mfaChallengeToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired MFA challenge');
  }
  const user = await User.findById(decoded.sub).select('+mfaSecret +mfaBackupCodes');
  if (!user || !user.mfaEnabled) {
    throw ApiError.unauthorized('Invalid or expired MFA challenge');
  }
  const secret = mfaService.decryptSecret(user.mfaSecret);
  const validTotp = mfaService.verifyToken(secret, code);
  const validBackup = !validTotp && (await mfaService.consumeBackupCode(user, code));
  if (!validTotp && !validBackup) {
    await securityEventService.record({ type: 'mfa_challenge_failed', user: user._id, email: user.email, ...context });
    throw ApiError.unauthorized('Invalid authentication code');
  }
  if (validBackup) await user.save({ validateBeforeSave: false });

  await securityEventService.record({ type: 'login_success', user: user._id, email: user.email, ...context });
  return { user, ...issueTokens(user) };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('No refresh token provided');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('The user belonging to this token no longer exists or is deactivated');
  }

  if ((decoded.v || 0) !== user.tokenVersion) {
    throw ApiError.unauthorized('Session has been revoked. Please log in again.');
  }

  return { user, ...issueTokens(user) };
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  refresh,
  updateProfile,
  changePassword,
  issueTokens,
  setupMfa,
  confirmMfaSetup,
  disableMfa,
  verifyMfaLogin,
  requestPasswordlessLogin,
  verifyPasswordlessLogin,
};
