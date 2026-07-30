const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const categoryService = require('../services/categoryService');

const list = catchAsync(async (req, res) => {
  const categories = await categoryService.listCategories();
  sendSuccess(res, { data: { categories } });
});

const getById = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  sendSuccess(res, { data: { category } });
});

const create = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Category created', data: { category } });
});

const update = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, { message: 'Category updated', data: { category } });
});

const remove = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, { message: 'Category deleted' });
});

module.exports = { list, getById, create, update, remove };
