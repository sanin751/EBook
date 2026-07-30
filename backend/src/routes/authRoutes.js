const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  updateProfileRules,
  changePasswordRules,
  mfaVerifySetupRules,
  mfaDisableRules,
  mfaLoginVerifyRules,
  passwordlessRequestRules,
  passwordlessVerifyRules,
} = require('../validations/authValidation');

const router = express.Router();

router.get('/captcha', authController.getCaptcha);
router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, validate, authController.resetPassword);
router.get('/me', protect, authController.me);
router.patch('/me', protect, updateProfileRules, validate, authController.updateMe);
router.patch(
  '/change-password',
  protect,
  authLimiter,
  changePasswordRules,
  validate,
  authController.changePassword
);

router.post('/mfa/setup', protect, authController.mfaSetup);
router.post('/mfa/verify-setup', protect, mfaVerifySetupRules, validate, authController.mfaVerifySetup);
router.post('/mfa/disable', protect, mfaDisableRules, validate, authController.mfaDisable);
router.post('/mfa/login-verify', authLimiter, mfaLoginVerifyRules, validate, authController.mfaLoginVerify);

router.post(
  '/passwordless/request',
  authLimiter,
  passwordlessRequestRules,
  validate,
  authController.passwordlessRequest
);
router.post(
  '/passwordless/verify',
  authLimiter,
  passwordlessVerifyRules,
  validate,
  authController.passwordlessVerify
);

module.exports = router;
