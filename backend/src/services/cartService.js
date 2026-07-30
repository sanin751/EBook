const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  await cart.populate('items.product', 'name price discountPrice images stock isActive');
  return cart;
}

function effectivePrice(product) {
  return product.discountPrice != null ? product.discountPrice : product.price;
}

async function addItem(userId, productId, options = {}) {
  const { quantity = 1, selectedFormat, variantLabel, giftMessage } = options;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw ApiError.notFound('Product not found');
  }
  if (product.stock < quantity) {
    throw ApiError.badRequest('Not enough stock available');
  }

  const cart = await getOrCreateCart(userId);
  // Only merge into an existing line if the product AND every customization
  // choice match exactly; otherwise it's a distinct line item (e.g. the
  // same book in a different format).
  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      (item.selectedFormat || null) === (selectedFormat || null) &&
      (item.variantLabel || null) === (variantLabel || null) &&
      (item.giftMessage || null) === (giftMessage || null)
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stock) {
      throw ApiError.badRequest('Not enough stock available');
    }
    existingItem.quantity = newQuantity;
    existingItem.price = effectivePrice(product);
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      price: effectivePrice(product),
      selectedFormat,
      variantLabel,
      giftMessage,
    });
  }

  await cart.save();
  await cart.populate('items.product', 'name price discountPrice images stock isActive');
  return cart;
}

async function updateItemQuantity(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) throw ApiError.notFound('Product no longer available');
  if (quantity > product.stock) throw ApiError.badRequest('Not enough stock available');

  item.quantity = quantity;
  item.price = effectivePrice(product);

  await cart.save();
  await cart.populate('items.product', 'name price discountPrice images stock isActive');
  return cart;
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  item.deleteOne();
  await cart.save();
  await cart.populate('items.product', 'name price discountPrice images stock isActive');
  return cart;
}

module.exports = { getCart, addItem, updateItemQuantity, removeItem };
