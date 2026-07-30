const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { createUserAndToken } = require('./helpers');

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

describe('Cart API', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  it('returns an empty cart for a new user', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/v1/cart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toEqual([]);
    expect(res.body.data.cart.totalItems).toBe(0);
  });

  it('adds an item to the cart', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.cart.items).toHaveLength(1);
    expect(res.body.data.cart.totalItems).toBe(2);
    expect(res.body.data.cart.totalPrice).toBe(40);
  });

  it('merges quantity when adding the same product twice', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.cart.items).toHaveLength(1);
    expect(res.body.data.cart.items[0].quantity).toBe(3);
  });

  it('carries selectedFormat, variantLabel, and giftMessage on the cart item', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        quantity: 1,
        selectedFormat: 'Paperback',
        variantLabel: "Collector's Edition",
        giftMessage: 'For Mom',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.cart.items[0]).toMatchObject({
      selectedFormat: 'Paperback',
      variantLabel: "Collector's Edition",
      giftMessage: 'For Mom',
    });
  });

  it('keeps differently-customized additions of the same product as separate line items', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct({ stock: 10 });

    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 1, selectedFormat: 'Paperback' });
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 1, selectedFormat: 'Hardcover' });

    expect(res.status).toBe(201);
    expect(res.body.data.cart.items).toHaveLength(2);
  });

  it('rejects adding more items than available stock', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct({ stock: 2 });

    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 5 });

    expect(res.status).toBe(400);
  });

  it('updates the quantity of a cart item', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct({ stock: 10 });

    const addRes = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 });
    const itemId = addRes.body.data.cart.items[0]._id;

    const res = await request(app)
      .put(`/api/v1/cart/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items[0].quantity).toBe(5);
  });

  it('removes an item from the cart', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    const addRes = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 1 });
    const itemId = addRes.body.data.cart.items[0]._id;

    const res = await request(app)
      .delete(`/api/v1/cart/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(0);
  });

  it('scopes carts per user', async () => {
    const { token: tokenA } = await createUserAndToken();
    const { token: tokenB } = await createUserAndToken();
    const product = await createProduct();

    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const res = await request(app).get('/api/v1/cart').set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.data.cart.items).toHaveLength(0);
  });
});
