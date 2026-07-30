const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

// Deliberately excludes ratingsAverage/ratingsCount (review-computed) and
// createdBy/_id (set once at creation time) from what a request body can touch.
const EDITABLE_FIELDS = [
  'name', 'description', 'price', 'discountPrice', 'category', 'stock', 'sku',
  'author', 'publisher', 'pages', 'isbn', 'formats', 'tags', 'isActive',
];

function imagePathsFromFiles(files) {
  return (files || []).map((file) => `/uploads/products/${file.filename}`);
}

// Multipart form fields arrive as either a plain string ("a, b, c"), a
// single repeated field (already an array), or absent entirely.
function normalizeStringList(value) {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.map((v) => `${v}`.trim()).filter(Boolean);
  return `${value}`
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

async function listProducts(queryParams) {
  const { page = 1, limit = 12, search, category, minPrice, maxPrice, sort, inStock, format, tag, minRating } =
    queryParams;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = minPrice;
    if (maxPrice != null) filter.price.$lte = maxPrice;
  }
  if (inStock) filter.stock = { $gt: 0 };
  if (search) filter.$text = { $search: search };
  if (format) filter.formats = format;
  if (tag) filter.tags = tag;
  if (minRating != null) filter.ratingsAverage = { $gte: minRating };

  const skip = (page - 1) * limit;
  const sortSpec = sort ? sort.split(',').join(' ') : '-createdAt';

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortSpec).skip(skip).limit(limit).populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function getProductById(id) {
  const product = await Product.findById(id).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

async function compareProducts(idsParam) {
  const ids = idsParam.split(',').map((id) => id.trim());
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).populate('category', 'name slug');

  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

async function createProduct(data, files, userId) {
  const category = await Category.findById(data.category);
  if (!category) throw ApiError.badRequest('Category does not exist');

  return Product.create({
    ...pick(data, EDITABLE_FIELDS),
    formats: normalizeStringList(data.formats) || [],
    tags: normalizeStringList(data.tags) || [],
    images: imagePathsFromFiles(files),
    createdBy: userId,
  });
}

async function updateProduct(id, data, files) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');

  if (data.category) {
    const category = await Category.findById(data.category);
    if (!category) throw ApiError.badRequest('Category does not exist');
  }

  const normalizedFormats = normalizeStringList(data.formats);
  const normalizedTags = normalizeStringList(data.tags);

  Object.assign(product, pick(data, EDITABLE_FIELDS));
  if (normalizedFormats) product.formats = normalizedFormats;
  if (normalizedTags) product.tags = normalizedTags;
  if (files && files.length) {
    product.images = imagePathsFromFiles(files);
  }

  await product.save();
  return product;
}

async function deleteProduct(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw ApiError.notFound('Product not found');
}

module.exports = { listProducts, getProductById, compareProducts, createProduct, updateProduct, deleteProduct };
