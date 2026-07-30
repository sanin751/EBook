const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const { createUserAndToken, createAdminAndToken } = require('./helpers');

async function createProduct(overrides = {}) {
  const category = await Category.create({ name: `Cat-${Date.now()}-${Math.random()}` });
  return Product.create({
    name: 'Book',
    description: 'A nice book',
    price: 20,
    stock: 50,
    category: category._id,
    ...overrides,
  });
}

const shippingAddress = {
  fullName: 'Jane Doe',
  phone: '9800000000',
  street: '456 Reader Ave',
  city: 'Bookville',
  country: 'Wonderland',
};

async function placeOrder(token, product, quantity) {
  await request(app)
    .post('/api/v1/cart')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product._id.toString(), quantity });
  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ shippingAddress });
  return res.body.data.order;
}

describe('Admin dashboard and reports', () => {
  it('rejects non-admin access to the dashboard and reports', async () => {
    const { token } = await createUserAndToken();
    const dashboardRes = await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${token}`);
    expect(dashboardRes.status).toBe(403);

    const ordersReportRes = await request(app).get('/api/v1/reports/orders').set('Authorization', `Bearer ${token}`);
    expect(ordersReportRes.status).toBe(403);

    const productsReportRes = await request(app)
      .get('/api/v1/reports/products')
      .set('Authorization', `Bearer ${token}`);
    expect(productsReportRes.status).toBe(403);
  });

  it('rejects unauthenticated access to the dashboard', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('returns dashboard metrics for an admin', async () => {
    const { token: userToken } = await createUserAndToken();
    const { token: adminToken } = await createAdminAndToken();
    const product = await createProduct({ price: 25 });
    const order = await placeOrder(userToken, product, 2);
    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'paid' });

    const res = await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalOrders).toBe(1);
    expect(res.body.data.totalCustomers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalRevenue).toBe(50);
    expect(res.body.data.recentOrders).toHaveLength(1);
    expect(res.body.data.topSellingProducts).toHaveLength(1);
    expect(res.body.data.topSellingProducts[0].totalQuantity).toBe(2);
  });

  it('returns an orders report filtered by status with summary totals', async () => {
    const { token: userToken } = await createUserAndToken();
    const { token: adminToken } = await createAdminAndToken();
    const product = await createProduct({ price: 10 });
    await placeOrder(userToken, product, 3);

    const res = await request(app)
      .get('/api/v1/reports/orders?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.meta.totalOrders).toBe(1);
    expect(res.body.meta.totalRevenue).toBe(30);
  });

  it('returns an orders report filtered by a date range', async () => {
    const { token: userToken } = await createUserAndToken();
    const { token: adminToken } = await createAdminAndToken();
    const product = await createProduct({ price: 10 });
    await placeOrder(userToken, product, 1);

    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const inRangeRes = await request(app)
      .get(`/api/v1/reports/orders?startDate=${past}&endDate=${future}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(inRangeRes.status).toBe(200);
    expect(inRangeRes.body.data.orders).toHaveLength(1);

    const outOfRangeRes = await request(app)
      .get(`/api/v1/reports/orders?startDate=${future}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(outOfRangeRes.status).toBe(200);
    expect(outOfRangeRes.body.data.orders).toHaveLength(0);
  });

  it('rejects an invalid status filter', async () => {
    const { token: adminToken } = await createAdminAndToken();
    const res = await request(app)
      .get('/api/v1/reports/orders?status=bogus')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('returns a top-selling products report', async () => {
    const { token: userToken } = await createUserAndToken();
    const { token: adminToken } = await createAdminAndToken();
    const productA = await createProduct({ name: 'Bowl', price: 10 });
    const productB = await createProduct({ name: 'Mug', price: 15 });
    await placeOrder(userToken, productA, 5);
    await placeOrder(userToken, productB, 1);

    const res = await request(app)
      .get('/api/v1/reports/products?limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].name).toBe('Bowl');
    expect(res.body.data.products[0].totalQuantity).toBe(5);
  });
});
