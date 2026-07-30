const request = require('supertest');
const app = require('../src/app');

describe('GET /api/v1/health', () => {
  it('returns 200 and OK status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Unknown route', () => {
  it('returns 404 via notFound middleware', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
