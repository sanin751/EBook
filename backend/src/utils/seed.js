const fs = require('fs');
const path = require('path');
require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const logger = require('./logger');
const { User, Category, Product } = require('../models');
const { BOOKS, categories, productsFor } = require('./seed-data');

const SEED_ASSETS_DIR = path.join(__dirname, '../seed-assets/products');
const UPLOADS_DIR = path.join(__dirname, '../../uploads/products');

function copySeedImages() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  for (const book of BOOKS) {
    fs.copyFileSync(path.join(SEED_ASSETS_DIR, book.cover), path.join(UPLOADS_DIR, book.cover));
  }
}

async function seed() {
  await connectDB();
  logger.info('Seeding database...');

  copySeedImages();

  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({})]);

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@ebook.com',
    password: 'Admin@12345',
    role: 'admin',
  });

  const createdCategories = await Category.insertMany(categories);
  const categoryMap = Object.fromEntries(createdCategories.map((c) => [c.name, c._id]));

  const products = productsFor(categoryMap).map((product) => ({ ...product, createdBy: admin._id }));
  await Product.insertMany(products);

  logger.info(`Seed complete: 1 admin, ${createdCategories.length} categories, ${products.length} products`);
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
