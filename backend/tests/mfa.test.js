const request = require('supertest');
const { authenticator } = require('otplib');
const app = require('../src/app');
const { createUserAndToken } = require('./helpers');

async function enrollMfa(token) {
  const setupRes = await request(app).post('/api/v1/auth/mfa/setup').set('Authorization', `Bearer ${token}`);
  const { manualEntryKey } = setupRes.body.data;
  const code = authenticator.generate(manualEntryKey);

  const verifyRes = await request(app)
    .post('/api/v1/auth/mfa/verify-setup')
    .set('Authorization', `Bearer ${token}`)
    .send({ code });

  return { manualEntryKey, backupCodes: verifyRes.body.data.backupCodes, verifyRes };
}

describe('MFA setup', () => {
  it('rejects unauthenticated access to setup', async () => {
    const res = await request(app).post('/api/v1/auth/mfa/setup');
    expect(res.status).toBe(401);
  });

  it('generates a QR code and manual entry key', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).post('/api/v1/auth/mfa/setup').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(res.body.data.manualEntryKey).toBeDefined();
  });

  it('rejects an invalid code at verify-setup', async () => {
    const { token } = await createUserAndToken();
    await request(app).post('/api/v1/auth/mfa/setup').set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/api/v1/auth/mfa/verify-setup')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });
    expect(res.status).toBe(400);
  });

  it('enables MFA and returns backup codes given a valid code', async () => {
    const { token } = await createUserAndToken();
    const { backupCodes, verifyRes } = await enrollMfa(token);

    expect(verifyRes.status).toBe(200);
    expect(backupCodes).toHaveLength(10);
  });
});

describe('Login with MFA enabled', () => {
  it('returns an MFA challenge instead of tokens on password login', async () => {
    const { user, token } = await createUserAndToken({ email: 'mfauser@example.com', password: 'Correct-Horse9' });
    await enrollMfa(token);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Correct-Horse9' });

    expect(res.status).toBe(200);
    expect(res.body.data.mfaRequired).toBe(true);
    expect(res.body.data.mfaChallengeToken).toBeDefined();
    expect(res.body.data.accessToken).toBeUndefined();
  });

  it('completes login with a valid TOTP code', async () => {
    const { user, token } = await createUserAndToken({ email: 'mfauser2@example.com', password: 'Correct-Horse9' });
    const { manualEntryKey } = await enrollMfa(token);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Correct-Horse9' });
    const { mfaChallengeToken } = loginRes.body.data;

    const code = authenticator.generate(manualEntryKey);
    const verifyRes = await request(app)
      .post('/api/v1/auth/mfa/login-verify')
      .send({ mfaChallengeToken, code });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.accessToken).toBeDefined();
  });

  it('rejects an incorrect TOTP code at login-verify', async () => {
    const { user, token } = await createUserAndToken({ email: 'mfauser3@example.com', password: 'Correct-Horse9' });
    await enrollMfa(token);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Correct-Horse9' });
    const { mfaChallengeToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/v1/auth/mfa/login-verify')
      .send({ mfaChallengeToken, code: '000000' });
    expect(res.status).toBe(401);
  });

  it('accepts a single-use backup code exactly once', async () => {
    const { user, token } = await createUserAndToken({ email: 'mfauser4@example.com', password: 'Correct-Horse9' });
    const { backupCodes } = await enrollMfa(token);
    const backupCode = backupCodes[0];

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Correct-Horse9' });

    const firstUse = await request(app)
      .post('/api/v1/auth/mfa/login-verify')
      .send({ mfaChallengeToken: loginRes.body.data.mfaChallengeToken, code: backupCode });
    expect(firstUse.status).toBe(200);

    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Correct-Horse9' });

    const secondUse = await request(app)
      .post('/api/v1/auth/mfa/login-verify')
      .send({ mfaChallengeToken: loginRes2.body.data.mfaChallengeToken, code: backupCode });
    expect(secondUse.status).toBe(401);
  });
});

describe('MFA disable', () => {
  it('disables MFA given the correct password and a valid code', async () => {
    const { user, token } = await createUserAndToken({ email: 'mfauser5@example.com', password: 'Correct-Horse9' });
    const { manualEntryKey } = await enrollMfa(token);

    const code = authenticator.generate(manualEntryKey);
    const res = await request(app)
      .post('/api/v1/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Correct-Horse9', code });
    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Correct-Horse9' });
    expect(loginRes.body.data.mfaRequired).toBeUndefined();
    expect(loginRes.body.data.accessToken).toBeDefined();
  });

  it('rejects disabling MFA with the wrong password', async () => {
    const { token } = await createUserAndToken({ email: 'mfauser6@example.com', password: 'Correct-Horse9' });
    const { manualEntryKey } = await enrollMfa(token);

    const code = authenticator.generate(manualEntryKey);
    const res = await request(app)
      .post('/api/v1/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword1!', code });
    expect(res.status).toBe(401);
  });
});
