// One-off: syncs the local MongoDB's Categories/Products to exactly match
// src/utils/seed-data.js, WITHOUT touching existing users, so real accounts
// created while testing the app aren't wiped (unlike src/utils/seed.js,
// which resets everything including users).
// Safe to re-run: existing books are updated in place (e.g. to pick up a
// newer cover image), and any product/category no longer in seed-data.js
// (e.g. a previous placeholder catalog) is removed.
const fs = require('fs');
const path = require('path');
require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const logger = require('../src/utils/logger');
const { User, Category, Product } = require('../src/models');
const { BOOKS, categories, productsFor } = require('../src/utils/seed-data');

const SEED_ASSETS_DIR = path.join(__dirname, '../src/seed-assets/products');
const UPLOADS_DIR = path.join(__dirname, '../uploads/products');

function copySeedImages() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  for (const book of BOOKS) {
    fs.copyFileSync(path.join(SEED_ASSETS_DIR, book.cover), path.join(UPLOADS_DIR, book.cover));
  }
}

async function run() {
  await connectDB();
  logger.info('Syncing books to match seed-data.js (users untouched)...');

  copySeedImages();

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: 'admin@ebook.com',
      password: 'Admin@12345',
      role: 'admin',
    });
    logger.info('Created admin user admin@ebook.com / Admin@12345');
  }

  const catalogNames = new Set(categories.map((c) => c.name));
  const existingCategories = await Category.find({ name: { $in: [...catalogNames] } });
  const existingNames = new Set(existingCategories.map((c) => c.name));
  const toCreate = categories.filter((c) => !existingNames.has(c.name));
  const createdCategories = toCreate.length ? await Category.insertMany(toCreate) : [];
  const allCategories = [...existingCategories, ...createdCategories];
  const categoryMap = Object.fromEntries(allCategories.map((c) => [c.name, c._id]));

  const products = productsFor(categoryMap);
  const productNames = new Set(products.map((p) => p.name));

  let inserted = 0;
  let updated = 0;
  for (const product of products) {
    const existing = await Product.findOne({ name: product.name });
    if (existing) {
      Object.assign(existing, product);
      await existing.save();
      updated += 1;
    } else {
      await Product.create({ ...product, createdBy: admin._id });
      inserted += 1;
    }
  }

  const removedProducts = await Product.deleteMany({ name: { $nin: [...productNames] } });
  const removedCategories = await Category.deleteMany({ name: { $nin: [...catalogNames] } });

  logger.info(
    `Done: ${createdCategories.length} new categories, ${inserted} new products, ${updated} updated products, ` +
      `${removedProducts.deletedCount} old products removed, ${removedCategories.deletedCount} old categories removed`
  );
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error('Sync failed:', err);
  process.exit(1);
});
