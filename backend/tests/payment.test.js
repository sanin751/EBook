jest.mock('../src/config/stripe', () => ({
  paymentIntents: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
}));

const request = require('supertest');
const app = require('../src/app');
const stripe = require('../src/config/stripe');
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/v1/payments/create-intent', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).post('/api/v1/payments/create-intent').send({ orderId: '64b3f1c2e1b1c2a3d4e5f6a7' });
    expect(res.status).toBe(401);
  });

  it('creates a Stripe payment intent for the order owner', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);

    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123', client_secret: 'pi_123_secret' });

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });

    expect(res.status).toBe(200);
    expect(res.body.data.clientSecret).toBe('pi_123_secret');
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4000, currency: 'npr' })
    );

    const payment = await Payment.findOne({ order: order._id });
    expect(payment.providerPaymentId).toBe('pi_123');
    expect(payment.status).toBe('pending');

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.payment.toString()).toBe(payment._id.toString());
  });

  it('rejects creating an intent for another user order', async () => {
    const { token: tokenA } = await createUserAndToken();
    const { token: tokenB } = await createUserAndToken();
    const order = await createOrderForUser(tokenA);

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ orderId: order._id });
    expect(res.status).toBe(404);
  });

  it('rejects creating an intent for an already-paid order', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);
    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'paid' });

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/payments/webhook', () => {
  it('marks the order and payment as paid on payment_intent.succeeded', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_456', client_secret: 'secret' });
    await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });

    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_456', payment_method_types: ['card'] } },
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', 'test-signature')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ any: 'payload' }));

    expect(res.status).toBe(200);

    const payment = await Payment.findOne({ order: order._id });
    expect(payment.status).toBe('succeeded');

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe('paid');
    expect(updatedOrder.status).toBe('processing');
  });

  it('marks the payment as failed on payment_intent.payment_failed', async () => {
    const { token } = await createUserAndToken();
    const order = await createOrderForUser(token);
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_789', client_secret: 'secret' });
    await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });

    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_789', payment_method_types: ['card'] } },
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', 'test-signature')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ any: 'payload' }));

    expect(res.status).toBe(200);

    const payment = await Payment.findOne({ order: order._id });
    expect(payment.status).toBe('failed');

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe('failed');
  });

  it('rejects a webhook with an invalid signature', async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('signature mismatch');
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', 'bad-signature')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ any: 'payload' }));

    expect(res.status).toBe(400);
  });
});
