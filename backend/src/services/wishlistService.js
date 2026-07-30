const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const cartService = require('./cartService');

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
}

async function getWishlist(userId) {
  const wishlist = await getOrCreateWishlist(userId);
  await wishlist.populate('products', 'name price discountPrice images stock isActive ratingsAverage');
  return wishlist;
}

async function addProduct(userId, productId) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw ApiError.notFound('Product not found');
  }

  const wishlist = await getOrCreateWishlist(userId);
  const alreadySaved = wishlist.products.some((id) => id.toString() === productId);
  if (!alreadySaved) {
    wishlist.products.push(product._id);
    await wishlist.save();
  }

  await wishlist.populate('products', 'name price discountPrice images stock isActive ratingsAverage');
  return wishlist;
}

async function removeProduct(userId, productId) {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
  await wishlist.save();
  await wishlist.populate('products', 'name price discountPrice images stock isActive ratingsAverage');
  return wishlist;
}

async function moveToCart(userId, productId, quantity = 1) {
  const wishlist = await getOrCreateWishlist(userId);
  const isSaved = wishlist.products.some((id) => id.toString() === productId);
  if (!isSaved) {
    throw ApiError.notFound('Product not found in wishlist');
  }

  const cart = await cartService.addItem(userId, productId, { quantity });

  wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
  await wishlist.save();

  return cart;
}

module.exports = { getWishlist, addProduct, removeProduct, moveToCart };
