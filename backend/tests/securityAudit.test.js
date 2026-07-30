const request = require('supertest');
const app = require('../src/app');
const SecurityEvent = require('../src/models/SecurityEvent');
const blockedIpService = require('../src/services/blockedIpService');
const { createUserAndToken, createAdminAndToken, registerViaHttp } = require('./helpers');

describe('Security event logging', () => {
  it('records a login_success event', async () => {
    const password = 'Correct-Horse9';
    const registerRes = await registerViaHttp({ name: 'Audit User', email: 'audituser@example.com', password });

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'audituser@example.com', password });

    const events = await SecurityEvent.find({ type: 'login_success', user: registerRes.body.data.user._id });
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('records a login_failure event with no user leak of the password', async () => {
    const password = 'Correct-Horse9';
    await registerViaHttp({ name: 'Audit User 2', email: 'audituser2@example.com', password });

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'audituser2@example.com', password: 'WrongPassword1!' });

    const event = await SecurityEvent.findOne({ type: 'login_failure', email: 'audituser2@example.com' }).lean();
    expect(event).toBeDefined();
    expect(JSON.stringify(event)).not.toMatch(/WrongPassword1!/);
  });
});

describe('GET /api/v1/admin/security/events', () => {
  it('rejects non-admin access', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/v1/admin/security/events').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns paginated events for an admin', async () => {
    await SecurityEvent.create({ type: 'login_success', email: 'someone@example.com' });
    const { token } = await createAdminAndToken();

    const res = await request(app).get('/api/v1/admin/security/events').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.events)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });
});

describe('Blocked IP admin endpoints', () => {
  it('rejects non-admin access to blocked-ip management', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/v1/admin/security/blocked-ips').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows an admin to block, list, and unblock an IP', async () => {
    const { token } = await createAdminAndToken();

    const blockRes = await request(app)
      .post('/api/v1/admin/security/blocked-ips')
      .set('Authorization', `Bearer ${token}`)
      .send({ ip: '203.0.113.5', reason: 'Manual test block' });
    expect(blockRes.status).toBe(201);

    const listRes = await request(app)
      .get('/api/v1/admin/security/blocked-ips')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.blockedIps.some((b) => b.ip === '203.0.113.5')).toBe(true);

    await request(app)
      .delete('/api/v1/admin/security/blocked-ips/203.0.113.5')
      .set('Authorization', `Bearer ${token}`);

    expect(await blockedIpService.isBlocked('203.0.113.5')).toBe(false);
  });
});

describe('Automatic IP blocking after repeated rate-limit violations', () => {
  it('blocks an IP after 3 recorded violations', async () => {
    const ip = '198.51.100.42';
    expect(await blockedIpService.isBlocked(ip)).toBe(false);

    blockedIpService.recordRateLimitViolation(ip);
    blockedIpService.recordRateLimitViolation(ip);
    expect(await blockedIpService.isBlocked(ip)).toBe(false);

    await blockedIpService.recordRateLimitViolation(ip);

    expect(await blockedIpService.isBlocked(ip)).toBe(true);
  });
});
