const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const { parseDurationMs } = require('../utils/token');
const env = require('../config/env');
const authService = require('../services/authService');
const captchaService = require('../services/captchaService');

const getCaptcha = catchAsync(async (req, res) => {
  const { captchaId, svg } = captchaService.generate();
  sendSuccess(res, { data: { captchaId, svg } });
});

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...refreshCookieOptions(),
    maxAge: parseDurationMs(env.jwt.refreshExpiresIn),
  });
}

function requestContext(req) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

const register = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body, requestContext(req));
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { statusCode: 201, message: 'Registered successfully', data: { user, accessToken } });
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body, requestContext(req));

  if (result.mfaRequired) {
    return sendSuccess(res, {
      message: 'MFA verification required',
      data: { mfaRequired: true, mfaChallengeToken: result.mfaChallengeToken },
    });
  }

  setRefreshCookie(res, result.refreshToken);
  sendSuccess(res, { message: 'Logged in successfully', data: { user: result.user, accessToken: result.accessToken } });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user._id, requestContext(req));
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  sendSuccess(res, { message: 'Logged out successfully' });
});

const refresh = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(req.cookies[REFRESH_COOKIE_NAME]);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: 'Token refreshed', data: { user, accessToken } });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetUrlBase = `${env.clientUrl}/reset-password`;
  await authService.forgotPassword(req.body.email, resetUrlBase, requestContext(req));
  sendSuccess(res, { message: 'If an account with that email exists, a reset link has been sent' });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password, requestContext(req));
  sendSuccess(res, { message: 'Password has been reset successfully' });
});

const me = catchAsync(async (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
});

const updateMe = catchAsync(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  sendSuccess(res, { message: 'Profile updated', data: { user } });
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword, requestContext(req));
  sendSuccess(res, { message: 'Password changed successfully' });
});

const mfaSetup = catchAsync(async (req, res) => {
  const { qrCodeDataUrl, manualEntryKey } = await authService.setupMfa(req.user._id);
  sendSuccess(res, { message: 'Scan the QR code with your authenticator app', data: { qrCodeDataUrl, manualEntryKey } });
});

const mfaVerifySetup = catchAsync(async (req, res) => {
  const { backupCodes } = await authService.confirmMfaSetup(req.user._id, req.body.code, requestContext(req));
  sendSuccess(res, {
    message: 'MFA enabled. Store these backup codes somewhere safe — each can only be used once.',
    data: { backupCodes },
  });
});

const mfaDisable = catchAsync(async (req, res) => {
  await authService.disableMfa(req.user._id, req.body.currentPassword, req.body.code, requestContext(req));
  sendSuccess(res, { message: 'MFA disabled' });
});

const mfaLoginVerify = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.verifyMfaLogin(
    req.body.mfaChallengeToken,
    req.body.code,
    requestContext(req)
  );
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: 'Logged in successfully', data: { user, accessToken } });
});

const passwordlessRequest = catchAsync(async (req, res) => {
  const magicUrlBase = `${env.clientUrl}/passwordless-login`;
  await authService.requestPasswordlessLogin(req.body.email, magicUrlBase, requestContext(req));
  sendSuccess(res, { message: 'If an account with that email exists, a login link has been sent' });
});

const passwordlessVerify = catchAsync(async (req, res) => {
  const result = await authService.verifyPasswordlessLogin(req.body.token, requestContext(req));

  if (result.mfaRequired) {
    return sendSuccess(res, {
      message: 'MFA verification required',
      data: { mfaRequired: true, mfaChallengeToken: result.mfaChallengeToken },
    });
  }

  setRefreshCookie(res, result.refreshToken);
  sendSuccess(res, { message: 'Logged in successfully', data: { user: result.user, accessToken: result.accessToken } });
});

module.exports = {
  getCaptcha,
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  me,
  updateMe,
  changePassword,
  mfaSetup,
  mfaVerifySetup,
  mfaDisable,
  mfaLoginVerify,
  passwordlessRequest,
  passwordlessVerify,
};
