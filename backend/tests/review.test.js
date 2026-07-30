const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { createUserAndToken, createAdminAndToken } = require('./helpers');

async function createProduct() {
  const category = await Category.create({ name: `Cat-${Date.now()}-${Math.random()}` });
  return Product.create({
    name: 'Book',
    description: 'A nice book',
    price: 20,
    stock: 5,
    category: category._id,
  });
}

describe('Review API', () => {
  it('rejects review creation without authentication', async () => {
    const product = await createProduct();
    const res = await request(app).post('/api/v1/reviews').send({ productId: product._id.toString(), rating: 5 });
    expect(res.status).toBe(401);
  });

  it('creates a review and updates the product rating', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), rating: 4, comment: 'Nice book' });

    expect(res.status).toBe(201);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.ratingsAverage).toBe(4);
    expect(updatedProduct.ratingsCount).toBe(1);
  });

  it('rejects a duplicate review from the same user', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), rating: 4 });

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), rating: 5 });

    expect(res.status).toBe(409);
  });

  it('rejects an out-of-range rating', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), rating: 7 });

    expect(res.status).toBe(400);
  });

  it('lists reviews for a product publicly', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();
    await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), rating: 5, comment: 'Great' });

    const res = await request(app).get(`/api/v1/reviews/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.reviews).toHaveLength(1);
    expect(res.body.data.reviews[0].user.name).toBeDefined();
  });

  it('allows the review owner to delete their review', async () => {
    const { token } = await createUserAndToken();
    const product = await createProduct();
    const createRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), rating: 3 });
    const reviewId = createRes.body.data.review._id;

    const res = await request(app).delete(`/api/v1/reviews/${reviewId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.ratingsCount).toBe(0);
  });

  it('prevents a different user from deleting someone elses review', async () => {
    const { token: owner } = await createUserAndToken();
    const { token: other } = await createUserAndToken();
    const product = await createProduct();
    const createRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${owner}`)
      .send({ productId: product._id.toString(), rating: 3 });
    const reviewId = createRes.body.data.review._id;

    const res = await request(app).delete(`/api/v1/reviews/${reviewId}`).set('Authorization', `Bearer ${other}`);
    expect(res.status).toBe(403);
  });

  it('allows an admin to delete any review', async () => {
    const { token: owner } = await createUserAndToken();
    const { token: adminToken } = await createAdminAndToken();
    const product = await createProduct();
    const createRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${owner}`)
      .send({ productId: product._id.toString(), rating: 3 });
    const reviewId = createRes.body.data.review._id;

    const res = await request(app).delete(`/api/v1/reviews/${reviewId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
