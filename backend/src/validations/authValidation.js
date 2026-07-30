const { body } = require('express-validator');

const PASSWORD_MIN = 10;
const PASSWORD_MAX = 128;

// A handful of very common passwords that otherwise pass the complexity
// regex below (e.g. "Password123!" itself). Not exhaustive — a real deployment
// would check against a breached-password corpus (e.g. HaveIBeenPwned's
// k-anonymity API) instead of a static list.
const COMMON_PASSWORDS = new Set([
  'password123!', 'password1!', 'qwerty123!', 'welcome123!', 'letmein123!',
  'admin123!', 'iloveyou123!', 'password1234', 'p@ssword123',
]);

function passwordComplexityRule(field) {
  return body(field)
    .isLength({ min: PASSWORD_MIN, max: PASSWORD_MAX })
    .withMessage(`Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`)
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one special character')
    .custom((value) => {
      if (COMMON_PASSWORDS.has(value.toLowerCase())) {
        throw new Error('This password is too common — please choose another');
      }
      return true;
    });
}

// Blocks a password that trivially contains the account's own identity
// (email local-part or name) — checked wherever that context is available.
function notIdentityBased(field, { emailField, nameField, useReqUser } = {}) {
  return body(field).custom((value, { req }) => {
    const email = useReqUser ? req.user?.email : req.body[emailField];
    const name = useReqUser ? req.user?.name : req.body[nameField];
    const lowerValue = value.toLowerCase();

    if (email) {
      const localPart = email.split('@')[0].toLowerCase();
      if (localPart.length >= 3 && lowerValue.includes(localPart)) {
        throw new Error('Password must not contain your email address');
      }
    }
    if (name) {
      const firstName = name.trim().split(/\s+/)[0]?.toLowerCase();
      if (firstName && firstName.length >= 3 && lowerValue.includes(firstName)) {
        throw new Error('Password must not contain your name');
      }
    }
    return true;
  });
}

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email').normalizeEmail(),
  passwordComplexityRule('password'),
  notIdentityBased('password', { emailField: 'email', nameField: 'name' }),
  body('captchaId').trim().notEmpty().withMessage('Captcha is required'),
  body('captchaText').trim().notEmpty().withMessage('Captcha answer is required'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('captchaId').optional().trim(),
  body('captchaText').optional().trim(),
];

const forgotPasswordRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  passwordComplexityRule('password'),
];

const updateProfileRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  passwordComplexityRule('newPassword'),
  notIdentityBased('newPassword', { useReqUser: true }),
];

const mfaVerifySetupRules = [
  body('code').trim().notEmpty().withMessage('Authentication code is required'),
];

const mfaDisableRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('code').trim().notEmpty().withMessage('Authentication code is required'),
];

const mfaLoginVerifyRules = [
  body('mfaChallengeToken').trim().notEmpty().withMessage('MFA challenge token is required'),
  body('code').trim().notEmpty().withMessage('Authentication code is required'),
];

const passwordlessRequestRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email').normalizeEmail(),
];

const passwordlessVerifyRules = [
  body('token').trim().notEmpty().withMessage('Login token is required'),
];

module.exports = {
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
};
