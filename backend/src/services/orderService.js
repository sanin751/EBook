const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

const SHIPPING_FEE = 0;

function effectivePrice(product) {
  return product.discountPrice != null ? product.discountPrice : product.price;
}

async function createOrder(userId, shippingAddress) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  const orderItems = [];
  let itemsTotal = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product;
    if (!product || !product.isActive) {
      throw ApiError.badRequest(`Product ${product ? product.name : ''} is no longer available`);
    }

    // Atomically decrement stock only if enough is still available, to avoid
    // a race between the stock check and the write under concurrent checkouts.
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: product._id, stock: { $gte: cartItem.quantity } },
      { $inc: { stock: -cartItem.quantity } },
      { returnDocument: 'after' }
    );

    if (!updatedProduct) {
      throw ApiError.badRequest(`Not enough stock for "${product.name}"`);
    }

    const price = effectivePrice(product);
    itemsTotal += price * cartItem.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || null,
      price,
      quantity: cartItem.quantity,
      selectedFormat: cartItem.selectedFormat,
      variantLabel: cartItem.variantLabel,
      giftMessage: cartItem.giftMessage,
    });
  }

  itemsTotal = Math.round(itemsTotal * 100) / 100;
  const totalAmount = Math.round((itemsTotal + SHIPPING_FEE) * 100) / 100;

  const order = await Order.create({
    user: userId,
    items: orderItems,
    shippingAddress,
    itemsTotal,
    shippingFee: SHIPPING_FEE,
    totalAmount,
  });

  cart.items = [];
  await cart.save();

  return order;
}

async function listOrders(userId) {
  return Order.find({ user: userId }).sort('-createdAt');
}

async function getOrderById(userId, orderId, isAdmin = false) {
  const order = await Order.findById(orderId);
  if (!order || (!isAdmin && order.user.toString() !== userId.toString())) {
    throw ApiError.notFound('Order not found');
  }
  return order;
}

async function listAllOrders() {
  return Order.find({}).sort('-createdAt').populate('user', 'name email');
}

async function updateOrderStatus(orderId, status) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  order.status = status;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
  } else if (status === 'cancelled') {
    order.cancelledAt = new Date();
  }

  await order.save();
  return order.populate('user', 'name email');
}

module.exports = { createOrder, listOrders, getOrderById, listAllOrders, updateOrderStatus };
