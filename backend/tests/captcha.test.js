const request = require('supertest');
const app = require('../src/app');
const { solveCaptcha } = require('./helpers');

const basePassword = 'Correct-Horse9';

describe('GET /api/v1/auth/captcha', () => {
  it('returns a captcha id and an SVG image', async () => {
    const res = await request(app).get('/api/v1/auth/captcha');
    expect(res.status).toBe(200);
    expect(res.body.data.captchaId).toBeDefined();
    expect(res.body.data.svg).toMatch(/^<svg/);
  });
});

describe('Registration requires a valid captcha', () => {
  it('rejects registration without a captcha', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'No Captcha', email: 'nocaptcha@example.com', password: basePassword });
    expect(res.status).toBe(400);
  });

  it('rejects registration with an incorrect captcha answer', async () => {
    const { captchaId } = await solveCaptcha();
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Wrong Captcha',
      email: 'wrongcaptcha@example.com',
      password: basePassword,
      captchaId,
      captchaText: 'wrong',
    });
    expect(res.status).toBe(400);
    expect(res.body.details.captchaRequired).toBe(true);
  });

  it('registers successfully with the correct captcha answer', async () => {
    const { captchaId, captchaText } = await solveCaptcha();
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Right Captcha',
      email: 'rightcaptcha@example.com',
      password: basePassword,
      captchaId,
      captchaText,
    });
    expect(res.status).toBe(201);
  });

  it('rejects reusing the same captcha id twice', async () => {
    const { captchaId, captchaText } = await solveCaptcha();
    await request(app).post('/api/v1/auth/register').send({
      name: 'First Use',
      email: 'firstuse@example.com',
      password: basePassword,
      captchaId,
      captchaText,
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Second Use',
      email: 'seconduse@example.com',
      password: basePassword,
      captchaId,
      captchaText,
    });
    expect(res.status).toBe(400);
  });
});

describe('Login CAPTCHA after repeated failures', () => {
  it('does not require a captcha before the failure threshold', async () => {
    const { captchaId, captchaText } = await solveCaptcha();
    await request(app).post('/api/v1/auth/register').send({
      name: 'Threshold User',
      email: 'threshold@example.com',
      password: basePassword,
      captchaId,
      captchaText,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'threshold@example.com', password: 'WrongPassword1!' });
    expect(res.status).toBe(401);
  });

  it('requires a captcha after 3 failed attempts', async () => {
    const { captchaId, captchaText } = await solveCaptcha();
    await request(app).post('/api/v1/auth/register').send({
      name: 'Locked Threshold',
      email: 'lockedthreshold@example.com',
      password: basePassword,
      captchaId,
      captchaText,
    });

    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'lockedthreshold@example.com', password: 'WrongPassword1!' });
    }

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lockedthreshold@example.com', password: basePassword });
    expect(res.status).toBe(400);
    expect(res.body.details.captchaRequired).toBe(true);
  });

  it('logs in once the correct captcha is supplied after the threshold', async () => {
    const { captchaId: signupCaptchaId, captchaText: signupCaptchaText } = await solveCaptcha();
    await request(app).post('/api/v1/auth/register').send({
      name: 'Captcha Recovery',
      email: 'captcharecovery@example.com',
      password: basePassword,
      captchaId: signupCaptchaId,
      captchaText: signupCaptchaText,
    });

    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'captcharecovery@example.com', password: 'WrongPassword1!' });
    }

    const { captchaId, captchaText } = await solveCaptcha();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'captcharecovery@example.com',
      password: basePassword,
      captchaId,
      captchaText,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
