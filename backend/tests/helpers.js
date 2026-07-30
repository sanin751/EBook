const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { signAccessToken } = require('../src/utils/token');
const captchaService = require('../src/services/captchaService');

async function createUserAndToken(overrides = {}) {
  const user = await User.create({
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'Password123',
    role: 'customer',
    ...overrides,
  });
  return { user, token: signAccessToken(user) };
}

async function createAdminAndToken(overrides = {}) {
  return createUserAndToken({ role: 'admin', ...overrides });
}

// Fetches a real CAPTCHA challenge from the running app and reads its answer
// back out of the captcha service's test-only store, so HTTP-level tests
// never have to solve a real image.
async function solveCaptcha() {
  const captchaRes = await request(app).get('/api/v1/auth/captcha');
  const { captchaId } = captchaRes.body.data;
  const { text } = captchaService._store.get(captchaId);
  return { captchaId, captchaText: text };
}

// POST /auth/register requires a solved CAPTCHA on every call.
async function registerViaHttp(overrides = {}) {
  const { captchaId, captchaText } = await solveCaptcha();
  return request(app)
    .post('/api/v1/auth/register')
    .send({ captchaId, captchaText, ...overrides });
}

module.exports = { createUserAndToken, createAdminAndToken, registerViaHttp, solveCaptcha };
