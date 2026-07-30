const request = require('supertest');
const path = require('path');
const app = require('../src/app');
const Category = require('../src/models/Category');
const { createAdminAndToken, createUserAndToken } = require('./helpers');

const sampleImage = path.join(__dirname, 'fixtures/sample.png');

async function createCategory() {
  return Category.create({ name: 'Fiction' });
}

describe('Product API', () => {
  it('rejects product creation without authentication', async () => {
    const category = await createCategory();
    const res = await request(app)
      .post('/api/v1/products')
      .field('name', 'Book')
      .field('description', 'A nice book')
      .field('price', '25')
      .field('category', category._id.toString());
    expect(res.status).toBe(401);
  });

  it('rejects product creation from a non-admin user', async () => {
    const category = await createCategory();
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Book')
      .field('description', 'A nice book')
      .field('price', '25')
      .field('category', category._id.toString());
    expect(res.status).toBe(403);
  });

  it('allows an admin to create a product with images', async () => {
    const category = await createCategory();
    const { token } = await createAdminAndToken();

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Tall Tale')
      .field('description', 'A tall hardcover novel')
      .field('price', '35.5')
      .field('stock', '10')
      .field('category', category._id.toString())
      .attach('images', sampleImage);

    expect(res.status).toBe(201);
    expect(res.body.data.product.images).toHaveLength(1);
    expect(res.body.data.product.price).toBe(35.5);
  });

  it('normalizes comma-separated formats and tags into arrays', async () => {
    const category = await createCategory();
    const { token } = await createAdminAndToken();

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Speckled Journal')
      .field('description', 'A journal with a speckled cover')
      .field('price', '20')
      .field('category', category._id.toString())
      .field('author', 'A. Writer')
      .field('publisher', 'Speckled Press')
      .field('pages', '240 pages')
      .field('isbn', '978-1-000000-01-1')
      .field('formats', 'Hardcover, Paperback, E-book')
      .field('tags', 'Bestseller, New Arrival');

    expect(res.status).toBe(201);
    expect(res.body.data.product.formats).toEqual(['Hardcover', 'Paperback', 'E-book']);
    expect(res.body.data.product.tags).toEqual(['Bestseller', 'New Arrival']);
    expect(res.body.data.product.author).toBe('A. Writer');
  });

  it('filters products by format and tag', async () => {
    const category = await createCategory();
    const Product = require('../src/models/Product');
    await Product.create({
      name: 'Sage Novel',
      description: 'desc',
      price: 10,
      stock: 5,
      category: category._id,
      formats: ['Paperback'],
      tags: ['New Arrival'],
    });
    await Product.create({
      name: 'Plain Novel',
      description: 'desc',
      price: 10,
      stock: 5,
      category: category._id,
    });

    const formatRes = await request(app).get('/api/v1/products?format=Paperback');
    expect(formatRes.body.data.products).toHaveLength(1);
    expect(formatRes.body.data.products[0].name).toBe('Sage Novel');

    const tagRes = await request(app).get('/api/v1/products?tag=New%20Arrival');
    expect(tagRes.body.data.products).toHaveLength(1);
    expect(tagRes.body.data.products[0].name).toBe('Sage Novel');
  });

  it('rejects a non-image file upload', async () => {
    const category = await createCategory();
    const { token } = await createAdminAndToken();
    const textFile = path.join(__dirname, 'fixtures/not-an-image.txt');
    require('fs').writeFileSync(textFile, 'not an image');

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Book')
      .field('description', 'desc')
      .field('price', '10')
      .field('category', category._id.toString())
      .attach('images', textFile);

    expect(res.status).toBe(400);
  });

  it('rejects a discount price that is not less than the price via a Mongoose ValidationError', async () => {
    const category = await createCategory();
    const { token } = await createAdminAndToken();

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Book')
      .field('description', 'desc')
      .field('price', '10')
      .field('discountPrice', '12')
      .field('category', category._id.toString());

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  it('rejects more than 5 uploaded images with a Multer error', async () => {
    const category = await createCategory();
    const { token } = await createAdminAndToken();

    let req = request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Book')
      .field('description', 'desc')
      .field('price', '10')
      .field('category', category._id.toString());

    for (let i = 0; i < 6; i += 1) {
      req = req.attach('images', sampleImage);
    }

    const res = await req;
    expect(res.status).toBe(400);
  });

  it('rejects a product with an invalid category id', async () => {
    const { token } = await createAdminAndToken();
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Book')
      .field('description', 'desc')
      .field('price', '10')
      .field('category', '64b3f1c2e1b1c2a3d4e5f6a7');
    expect(res.status).toBe(400);
  });

  describe('GET /products/compare', () => {
    it('returns products in the requested order, ignoring inactive/missing ids', async () => {
      const category = await createCategory();
      const Product = require('../src/models/Product');
      const a = await Product.create({ name: 'A', description: 'd', price: 10, stock: 1, category: category._id });
      const b = await Product.create({ name: 'B', description: 'd', price: 20, stock: 1, category: category._id });
      const inactive = await Product.create({
        name: 'C',
        description: 'd',
        price: 30,
        stock: 1,
        category: category._id,
        isActive: false,
      });

      const res = await request(app).get(`/api/v1/products/compare?ids=${b._id},${a._id},${inactive._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.products.map((p) => p.name)).toEqual(['B', 'A']);
    });

    it('rejects fewer than 2 ids', async () => {
      const category = await createCategory();
      const Product = require('../src/models/Product');
      const a = await Product.create({ name: 'A', description: 'd', price: 10, stock: 1, category: category._id });

      const res = await request(app).get(`/api/v1/products/compare?ids=${a._id}`);
      expect(res.status).toBe(400);
    });

    it('rejects malformed ids', async () => {
      const res = await request(app).get('/api/v1/products/compare?ids=abc,def');
      expect(res.status).toBe(400);
    });
  });

  describe('with seeded products', () => {
    let categoryA;
    let categoryB;
    let cheapProduct;
    let expensiveProduct;
    let token;

    beforeEach(async () => {
      categoryA = await Category.create({ name: 'Non-Fiction' });
      categoryB = await Category.create({ name: 'Sci-Fi & Fantasy' });
      ({ token } = await createAdminAndToken());

      const Product = require('../src/models/Product');
      cheapProduct = await Product.create({
        name: 'Small Book',
        description: 'A small paperback novel',
        price: 10,
        stock: 5,
        category: categoryA._id,
      });
      expensiveProduct = await Product.create({
        name: 'Large Book',
        description: 'A large hardcover novel',
        price: 50,
        stock: 0,
        category: categoryB._id,
      });
    });

    it('lists all active products with pagination meta', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('filters products by category', async () => {
      const res = await request(app).get(`/api/v1/products?category=${categoryA._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].name).toBe('Small Book');
    });

    it('filters products by price range', async () => {
      const res = await request(app).get('/api/v1/products?minPrice=20&maxPrice=60');
      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].name).toBe('Large Book');
    });

    it('filters products by inStock', async () => {
      const res = await request(app).get('/api/v1/products?inStock=true');
      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].name).toBe('Small Book');
    });

    it('gets a single product by id', async () => {
      const res = await request(app).get(`/api/v1/products/${cheapProduct._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.product.name).toBe('Small Book');
    });

    it('returns 404 for a non-existent product', async () => {
      const res = await request(app).get('/api/v1/products/64b3f1c2e1b1c2a3d4e5f6a7');
      expect(res.status).toBe(404);
    });

    it('allows an admin to update a product', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${cheapProduct._id}`)
        .set('Authorization', `Bearer ${token}`)
        .field('price', '15');
      expect(res.status).toBe(200);
      expect(res.body.data.product.price).toBe(15);
    });

    it('allows an admin to delete a product', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${cheapProduct._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const getRes = await request(app).get(`/api/v1/products/${cheapProduct._id}`);
      expect(getRes.status).toBe(404);
    });
  });
});
