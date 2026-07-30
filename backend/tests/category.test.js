const request = require('supertest');
const app = require('../src/app');
const { createAdminAndToken, createUserAndToken } = require('./helpers');

describe('Category API', () => {
  it('lists categories publicly', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.categories).toEqual([]);
  });

  it('rejects category creation without authentication', async () => {
    const res = await request(app).post('/api/v1/categories').send({ name: 'Fiction' });
    expect(res.status).toBe(401);
  });

  it('rejects category creation from a non-admin user', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Fiction' });
    expect(res.status).toBe(403);
  });

  it('rejects a duplicate category name with a 409 from the raw Mongo duplicate key error', async () => {
    const { token } = await createAdminAndToken();
    await request(app).post('/api/v1/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Fiction' });

    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Fiction' });
    expect(res.status).toBe(409);
  });

  it('allows an admin to create, update, and delete a category', async () => {
    const { token } = await createAdminAndToken();

    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Fiction', description: 'Literary fiction' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.category.slug).toBe('fiction');
    const categoryId = createRes.body.data.category._id;

    const updateRes = await request(app)
      .put(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated description' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.category.description).toBe('Updated description');

    const getRes = await request(app).get(`/api/v1/categories/${categoryId}`);
    expect(getRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const getAfterDelete = await request(app).get(`/api/v1/categories/${categoryId}`);
    expect(getAfterDelete.status).toBe(404);
  });
});
