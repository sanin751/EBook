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

describe('Wishlist API', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/wishlist');
    expect(res.status).toBe(401);
  });

  it('returns an empty wishlist for a new user', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/v1/wishlist').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.wishlist.products).toEqual([]);
  });

  it('adds a product to the wishlist', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    const res = await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.data.wishlist.products).toHaveLength(1);
    expect(res.body.data.wishlist.products[0].name).toBe('Book');
  });

  it('does not duplicate a product added twice', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString() });
    const res = await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.data.wishlist.products).toHaveLength(1);
  });

  it('removes a product from the wishlist', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();
    await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString() });

    const res = await request(app)
      .delete(`/api/v1/wishlist/${product._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.wishlist.products).toHaveLength(0);
  });

  it('moves a product from the wishlist into the cart', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct({ stock: 10 });
    await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString() });

    const res = await request(app)
      .post(`/api/v1/wishlist/${product._id}/move-to-cart`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(1);
    expect(res.body.data.cart.items[0].quantity).toBe(2);

    const wishlistRes = await request(app).get('/api/v1/wishlist').set('Authorization', `Bearer ${token}`);
    expect(wishlistRes.body.data.wishlist.products).toHaveLength(0);
  });

  it('rejects moving a product that is not in the wishlist', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    const res = await request(app)
      .post(`/api/v1/wishlist/${product._id}/move-to-cart`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
  });

  it('scopes wishlists per user', async () => {
    const { token: tokenA } = await createUserAndToken();
    const { token: tokenB } = await createUserAndToken();
    const product = await createProduct();

    await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: product._id.toString() });

    const res = await request(app).get('/api/v1/wishlist').set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.data.wishlist.products).toHaveLength(0);
  });
});
