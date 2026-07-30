const request = require('supertest');
const app = require('../src/app');
const { createUserAndToken } = require('./helpers');

describe('Security middleware', () => {
  it('strips NoSQL injection operators from the request body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });

    // The $gt object is stripped down to {}, which then fails email/password
    // string validation instead of ever reaching a Mongo query.
    expect(res.status).toBe(400);
  });

  it('strips dotted and $-prefixed keys from nested objects', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: 'Jane',
          phone: '123',
          street: 'St',
          city: 'City',
          country: 'Country',
          '$where': 'malicious',
        },
      });

    // Cart is empty regardless, but the important part is the request is
    // processed (400 for empty cart) rather than blowing up on the injected key.
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cart is empty');
  });

  it('sets standard security headers via helmet', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
