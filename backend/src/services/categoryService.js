const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

async function listCategories() {
  return Category.find({ isActive: true }).sort('name');
}

async function getCategoryById(id) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

async function createCategory(data) {
  return Category.create(data);
}

async function updateCategory(id, data) {
  const category = await Category.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

async function deleteCategory(id) {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw ApiError.notFound('Category not found');
}

module.exports = { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
