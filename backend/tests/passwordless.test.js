const request = require('supertest');
const crypto = require('crypto');
const { authenticator } = require('otplib');
const app = require('../src/app');
const User = require('../src/models/User');
const { registerViaHttp } = require('./helpers');

describe('POST /api/v1/auth/passwordless/request', () => {
  it('does not reveal whether an email exists', async () => {
    const res = await request(app)
      .post('/api/v1/auth/passwordless/request')
      .send({ email: 'doesnotexist@example.com' });
    expect(res.status).toBe(200);
  });

  it('sets a passwordless token on the user record', async () => {
    await registerViaHttp({ name: 'Magic User', email: 'magicuser@example.com', password: 'Correct-Horse9' });

    const res = await request(app)
      .post('/api/v1/auth/passwordless/request')
      .send({ email: 'magicuser@example.com' });
    expect(res.status).toBe(200);

    const user = await User.findOne({ email: 'magicuser@example.com' });
    expect(user.passwordlessToken).toBeDefined();
  });
});

describe('POST /api/v1/auth/passwordless/verify', () => {
  it('rejects an invalid or expired token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/passwordless/verify')
      .send({ token: 'bogus-token' });
    expect(res.status).toBe(400);
  });

  it('logs in with a valid magic link token and consumes it (single use)', async () => {
    await registerViaHttp({ name: 'Magic User 2', email: 'magicuser2@example.com', password: 'Correct-Horse9' });
    await request(app).post('/api/v1/auth/passwordless/request').send({ email: 'magicuser2@example.com' });

    // Simulate the flow the same way auth.test.js does for password reset:
    // generate a token the same way the service does and store its hash
    // directly, mirroring what requestPasswordlessLogin produced.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const user = await User.findOne({ email: 'magicuser2@example.com' });
    user.passwordlessToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordlessTokenExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const res = await request(app).post('/api/v1/auth/passwordless/verify').send({ token: rawToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();

    const reuseRes = await request(app).post('/api/v1/auth/passwordless/verify').send({ token: rawToken });
    expect(reuseRes.status).toBe(400);
  });

  it('routes an MFA-enabled account through the MFA challenge instead of bypassing it', async () => {
    const registerRes = await registerViaHttp({
      name: 'Magic MFA User',
      email: 'magicmfa@example.com',
      password: 'Correct-Horse9',
    });
    const token = registerRes.body.data.accessToken;

    const setupRes = await request(app).post('/api/v1/auth/mfa/setup').set('Authorization', `Bearer ${token}`);
    const code = authenticator.generate(setupRes.body.data.manualEntryKey);
    await request(app)
      .post('/api/v1/auth/mfa/verify-setup')
      .set('Authorization', `Bearer ${token}`)
      .send({ code });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const user = await User.findOne({ email: 'magicmfa@example.com' });
    user.passwordlessToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordlessTokenExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const res = await request(app).post('/api/v1/auth/passwordless/verify').send({ token: rawToken });
    expect(res.status).toBe(200);
    expect(res.body.data.mfaRequired).toBe(true);
    expect(res.body.data.accessToken).toBeUndefined();
  });
});
