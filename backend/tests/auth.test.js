const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const User = require('../src/models/User');
const { registerViaHttp, solveCaptcha } = require('./helpers');

const validUser = { name: 'Jane Doe', email: 'jane@example.com', password: 'Correct-Horse9' };

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns an access token + user without password', async () => {
    const res = await registerViaHttp(validUser);
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
  });

  it('rejects duplicate email registration', async () => {
    await registerViaHttp(validUser);
    const res = await registerViaHttp(validUser);
    expect(res.status).toBe(409);
  });

  it('rejects a weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'weak@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await registerViaHttp(validUser);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects incorrect password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: validUser.email,
      password: 'WrongPassword1',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const registerRes = await registerViaHttp(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/auth/me', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).patch('/api/v1/auth/me').send({ name: 'New Name' });
    expect(res.status).toBe(401);
  });

  it('updates the current user name', async () => {
    const registerRes = await registerViaHttp(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
  });

  it('rejects an empty name', async () => {
    const registerRes = await registerViaHttp(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('rejects a missing refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid refresh token cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', ['refreshToken=bogus']);
    expect(res.status).toBe(401);
  });

  it('issues a new access token from a valid refresh token cookie', async () => {
    const registerRes = await registerViaHttp(validUser);
    const refreshCookie = registerRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));

    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', [refreshCookie]);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${res.body.data.accessToken}`);
    expect(meRes.status).toBe(200);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });

  it('clears the refresh token cookie and revokes outstanding refresh tokens', async () => {
    const registerRes = await registerViaHttp(validUser);
    const { accessToken } = registerRes.body.data;
    const refreshCookie = registerRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));

    const res = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=;/);

    const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', [refreshCookie]);
    expect(refreshRes.status).toBe(401);
  });
});

describe('Password reset flow', () => {
  it('generates a reset token and allows resetting the password', async () => {
    await registerViaHttp(validUser);

    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({ email: validUser.email });
    expect(forgotRes.status).toBe(200);

    const user = await User.findOne({ email: validUser.email });
    expect(user.passwordResetToken).toBeDefined();

    // Reconstruct the raw token is not possible from the hash, so we simulate
    // the flow by generating a token the same way the service does and
    // storing its hash directly, mirroring what forgotPassword produced.
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, password: 'NewPassword123!' });
    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'NewPassword123!' });
    expect(loginRes.status).toBe(200);
  });

  it('rejects an invalid or expired reset token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'bogus-token', password: 'NewPassword123!' });
    expect(res.status).toBe(400);
  });

  it('does not reveal whether an email exists', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'doesnotexist@example.com' });
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/v1/auth/change-password', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .send({ currentPassword: validUser.password, newPassword: 'NewPassword123!' });
    expect(res.status).toBe(401);
  });

  it('rejects an incorrect current password', async () => {
    const registerRes = await registerViaHttp(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword1', newPassword: 'NewPassword123!' });
    expect(res.status).toBe(401);
  });

  it('rejects a weak new password', async () => {
    const registerRes = await registerViaHttp(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: validUser.password, newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  it('changes the password when the current password is correct', async () => {
    const registerRes = await registerViaHttp(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: validUser.password, newPassword: 'NewPassword123!' });
    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'NewPassword123!' });
    expect(loginRes.status).toBe(200);
  });

  it('rejects reusing the current password', async () => {
    const registerRes = await registerViaHttp(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: validUser.password, newPassword: validUser.password });
    expect(res.status).toBe(400);
  });

  it('revokes other sessions by bumping the token version', async () => {
    const registerRes = await registerViaHttp(validUser);
    const { accessToken } = registerRes.body.data;
    const refreshCookie = registerRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));

    await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: validUser.password, newPassword: 'NewPassword123!' });

    const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', [refreshCookie]);
    expect(refreshRes.status).toBe(401);
  });
});

describe('Account lockout', () => {
  it('locks the account after repeated failed login attempts', async () => {
    await registerViaHttp(validUser);

    let lastRes;
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const { captchaId, captchaText } = await solveCaptcha();
      // eslint-disable-next-line no-await-in-loop
      lastRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword1!', captchaId, captchaText });
    }
    expect(lastRes.status).toBe(401);

    const { captchaId, captchaText } = await solveCaptcha();
    const lockedRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password, captchaId, captchaText });
    expect(lockedRes.status).toBe(423);
    expect(lockedRes.body.details.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets the failed-attempt counter after a successful login', async () => {
    await registerViaHttp(validUser);

    await request(app).post('/api/v1/auth/login').send({ email: validUser.email, password: 'WrongPassword1!' });
    await request(app).post('/api/v1/auth/login').send({ email: validUser.email, password: 'WrongPassword1!' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);

    const user = await User.findOne({ email: validUser.email });
    expect(user.failedLoginAttempts).toBe(0);
  });
});

describe('Password policy', () => {
  it('rejects a password that does not meet complexity requirements', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'nocomplexity@example.com', password: 'alllowercase123' });
    expect(res.status).toBe(400);
  });

  it('rejects a password containing the account email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'complexpw@example.com', password: 'Complexpw-Passw0rd!' });
    expect(res.status).toBe(400);
  });
});
