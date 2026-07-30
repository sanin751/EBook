const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { createUserAndToken, createAdminAndToken } = require('./helpers');

const shippingAddress = {
  fullName: 'Jane Doe',
  phone: '9800000000',
  street: '456 Reader Ave',
  city: 'Bookville',
  country: 'Wonderland',
};

async function createProduct(overrides = {}) {
  const category = await Category.create({ name: `Cat-${Date.now()}-${Math.random()}` });
  return Product.create({
    name: 'Book',
    description: 'A nice book',
    price: 20,
    stock: 5,
    category: category._id,
    ...overrides,
  });
}

async function addToCart(token, product, quantity = 1) {
  return request(app)
    .post('/api/v1/cart')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product._id.toString(), quantity });
}

describe('Order API', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).post('/api/v1/orders').send({ shippingAddress });
    expect(res.status).toBe(401);
  });

  it('rejects checkout with an empty cart', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress });
    expect(res.status).toBe(400);
  });

  it('rejects checkout with missing shipping address fields', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();
    await addToCart(token, product, 1);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress: { fullName: 'Jane' } });
    expect(res.status).toBe(400);
  });

  it('creates an order from the cart, decrements stock, and clears the cart', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct({ stock: 5, price: 20 });
    await addToCart(token, product, 2);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress });

    expect(res.status).toBe(201);
    expect(res.body.data.order.items).toHaveLength(1);
    expect(res.body.data.order.items[0].quantity).toBe(2);
    expect(res.body.data.order.itemsTotal).toBe(40);
    expect(res.body.data.order.totalAmount).toBe(40);
    expect(res.body.data.order.status).toBe('pending');
    expect(res.body.data.order.paymentStatus).toBe('pending');

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(3);

    const cartRes = await request(app).get('/api/v1/cart').set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.cart.items).toHaveLength(0);
  });

  it('carries selectedFormat, variantLabel, and giftMessage through to the order item', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct({ stock: 5, price: 20 });

    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        quantity: 1,
        selectedFormat: 'Paperback',
        variantLabel: "Collector's Edition",
        giftMessage: 'For Mom',
      });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress });

    expect(res.status).toBe(201);
    expect(res.body.data.order.items[0]).toMatchObject({
      selectedFormat: 'Paperback',
      variantLabel: "Collector's Edition",
      giftMessage: 'For Mom',
    });
  });

  it('rejects checkout when stock is insufficient at order time', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct({ stock: 2 });
    await addToCart(token, product, 2);

    // Simulate another purchase draining stock between add-to-cart and checkout.
    await Product.findByIdAndUpdate(product._id, { stock: 0 });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress });
    expect(res.status).toBe(400);
  });

  it('lists only the current user orders and enforces ownership on getById', async () => {
    const { token: tokenA } = await createUserAndToken();
    const { token: tokenB } = await createUserAndToken();
    const product = await createProduct({ stock: 5 });
    await addToCart(tokenA, product, 1);

    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ shippingAddress });
    const orderId = createRes.body.data.order._id;

    const listResA = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${tokenA}`);
    expect(listResA.body.data.orders).toHaveLength(1);

    const listResB = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${tokenB}`);
    expect(listResB.body.data.orders).toHaveLength(0);

    const getResA = await request(app).get(`/api/v1/orders/${orderId}`).set('Authorization', `Bearer ${tokenA}`);
    expect(getResA.status).toBe(200);

    const getResB = await request(app).get(`/api/v1/orders/${orderId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(getResB.status).toBe(404);
  });

  describe('Admin order management', () => {
    it('rejects non-admin access to the admin order list and status update', async () => {
      const { token } = await createUserAndToken();
      const listRes = await request(app).get('/api/v1/orders/admin/all').set('Authorization', `Bearer ${token}`);
      expect(listRes.status).toBe(403);

      const statusRes = await request(app)
        .patch('/api/v1/orders/000000000000000000000000/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'shipped' });
      expect(statusRes.status).toBe(403);
    });

    it('lets an admin list every user order with customer details', async () => {
      const { token: userToken } = await createUserAndToken();
      const { token: adminToken } = await createAdminAndToken();
      const product = await createProduct({ stock: 5 });
      await addToCart(userToken, product, 1);
      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ shippingAddress });

      const res = await request(app).get('/api/v1/orders/admin/all').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBeGreaterThan(0);
      expect(res.body.data.orders[0].user).toHaveProperty('email');
    });

    it('lets an admin update order status, stamping deliveredAt on delivery', async () => {
      const { token: userToken } = await createUserAndToken();
      const { token: adminToken } = await createAdminAndToken();
      const product = await createProduct({ stock: 5 });
      await addToCart(userToken, product, 1);
      const createRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ shippingAddress });
      const orderId = createRes.body.data.order._id;

      const updateRes = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.order.status).toBe('delivered');
      expect(updateRes.body.data.order.deliveredAt).toBeTruthy();

      const userViewRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(userViewRes.body.data.order.status).toBe('delivered');
    });

    it('rejects an invalid status value', async () => {
      const { token: userToken } = await createUserAndToken();
      const { token: adminToken } = await createAdminAndToken();
      const product = await createProduct({ stock: 5 });
      await addToCart(userToken, product, 1);
      const createRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ shippingAddress });
      const orderId = createRes.body.data.order._id;

      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'teleported' });
      expect(res.status).toBe(400);
    });
  });
});
