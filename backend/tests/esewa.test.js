const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const env = require('../src/config/env');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const { createUserAndToken } = require('./helpers');

const shippingAddress = {
  fullName: 'Jane Doe',
  phone: '9800000000',
  street: '456 Reader Ave',
  city: 'Bookville',
  country: 'Wonderland',
};

async function createOrderForUser(token) {
  const category = await Category.create({ name: `Cat-${Date.now()}-${Math.random()}` });
  const product = await Product.create({
    name: 'Book',
    description: 'A nice book',
    price: 20,
    stock: 5,
    category: category._id,
  });
  await request(app)
    .post('/api/v1/cart')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product._id.toString(), quantity: 2 });

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ shippingAddress });
  return res.body.data.order;
}

function signEsewaPayload(fields, signedFieldNames) {
  const message = signedFieldNames
    .split(',')
    .map((field) => `${field}=${fields[field]}`)
    .join(',');
  return crypto.createHmac('sha256', env.esewa.secretKey).update(message).digest('base64');
}

function buildCallbackData(overrides = {}) {
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const payload = {
    total_amount: '40.00',
    transaction_uuid: 'uuid-placeholder',
    product_code: env.esewa.productCode,
    status: 'COMPLETE',
    signed_field_names: signedFieldNames,
    ...overrides,
  };
  payload.signature = signEsewaPayload(payload, signedFieldNames);
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

describe('POST /api/v1/payments/esewa/initiate', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app)
      .post('/api/v1/payments/esewa/initiate')
      .send({ orderId: '64b3f1c2e1b1c2a3d4e5f6a7' });
    expect(res.status).toBe(401);
  });

  it('returns a signed form payload for the order owner', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);

    const res = await request(app)
      .post('/api/v1/payments/esewa/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });

    expect(res.status).toBe(200);
    expect(res.body.data.gatewayUrl).toBe(env.esewa.gatewayUrl);
    expect(res.body.data.fields.total_amount).toBe('40.00');
    expect(res.body.data.fields.product_code).toBe(env.esewa.productCode);
    expect(res.body.data.fields.signature).toBeDefined();

    const payment = await Payment.findOne({ order: order._id });
    expect(payment.provider).toBe('esewa');
    expect(payment.providerPaymentId).toBe(res.body.data.fields.transaction_uuid);
  });

  it('rejects initiating for another user order', async () => {
    const { token: tokenA } = await createUserAndToken();
    const { token: tokenB } = await createUserAndToken();
    const order = await createOrderForUser(tokenA);

    const res = await request(app)
      .post('/api/v1/payments/esewa/initiate')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ orderId: order._id });
    expect(res.status).toBe(404);
  });

  it('rejects initiating for an already-paid order', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);
    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'paid' });

    const res = await request(app)
      .post('/api/v1/payments/esewa/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/v1/payments/esewa/success', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('marks the order paid when eSewa confirms COMPLETE status', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);
    const initiateRes = await request(app)
      .post('/api/v1/payments/esewa/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });
    const transactionUuid = initiateRes.body.data.fields.transaction_uuid;

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'COMPLETE' }) });

    const data = buildCallbackData({ transaction_uuid: transactionUuid });
    const res = await request(app).get(`/api/v1/payments/esewa/success?data=${encodeURIComponent(data)}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${env.clientUrl}/checkout/confirmation/${order._id}?payment=success`);

    const payment = await Payment.findOne({ order: order._id });
    expect(payment.status).toBe('succeeded');
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe('paid');
    expect(updatedOrder.status).toBe('processing');
  });

  it('marks the order failed when eSewa does not confirm COMPLETE', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);
    const initiateRes = await request(app)
      .post('/api/v1/payments/esewa/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });
    const transactionUuid = initiateRes.body.data.fields.transaction_uuid;

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'PENDING' }) });

    const data = buildCallbackData({ transaction_uuid: transactionUuid });
    const res = await request(app).get(`/api/v1/payments/esewa/success?data=${encodeURIComponent(data)}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${env.clientUrl}/checkout/confirmation/${order._id}?payment=failed`);

    const payment = await Payment.findOne({ order: order._id });
    expect(payment.status).toBe('failed');
  });

  it('redirects to the payment page on a tampered signature instead of crashing', async () => {
    const data = buildCallbackData({ transaction_uuid: 'bogus', signature: 'tampered' });
    const res = await request(app).get(`/api/v1/payments/esewa/success?data=${encodeURIComponent(data)}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${env.clientUrl}/checkout/payment?payment=error`);
  });
});

describe('GET /api/v1/payments/esewa/failure', () => {
  it('marks the payment failed and redirects to the confirmation page', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);
    const initiateRes = await request(app)
      .post('/api/v1/payments/esewa/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });
    const transactionUuid = initiateRes.body.data.fields.transaction_uuid;

    const data = Buffer.from(JSON.stringify({ transaction_uuid: transactionUuid })).toString('base64');
    const res = await request(app).get(`/api/v1/payments/esewa/failure?data=${encodeURIComponent(data)}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${env.clientUrl}/checkout/confirmation/${order._id}?payment=failed`);

    const payment = await Payment.findOne({ order: order._id });
    expect(payment.status).toBe('failed');
  });
});

describe('POST /api/v1/payments/cod', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).post('/api/v1/payments/cod').send({ orderId: '64b3f1c2e1b1c2a3d4e5f6a7' });
    expect(res.status).toBe(401);
  });

  it('creates a cod payment and moves the order to processing', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);

    const res = await request(app)
      .post('/api/v1/payments/cod')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('processing');
    expect(res.body.data.order.paymentStatus).toBe('pending');

    const payment = await Payment.findOne({ order: order._id });
    expect(payment.provider).toBe('cod');
    expect(payment.method).toBe('cod');
  });

  it('rejects an already-paid order', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);
    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'paid' });

    const res = await request(app)
      .post('/api/v1/payments/cod')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });
    expect(res.status).toBe(409);
  });
});
