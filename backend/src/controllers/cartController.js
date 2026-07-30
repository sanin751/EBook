const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const cartService = require('../services/cartService');

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  sendSuccess(res, { data: { cart } });
});

const addItem = catchAsync(async (req, res) => {
  const { productId, quantity, selectedFormat, variantLabel, giftMessage } = req.body;
  const cart = await cartService.addItem(req.user._id, productId, {
    quantity: quantity || 1,
    selectedFormat,
    variantLabel,
    giftMessage,
  });
  sendSuccess(res, { statusCode: 201, message: 'Item added to cart', data: { cart } });
});

const updateItem = catchAsync(async (req, res) => {
  const cart = await cartService.updateItemQuantity(req.user._id, req.params.id, req.body.quantity);
  sendSuccess(res, { message: 'Cart item updated', data: { cart } });
});

const removeItem = catchAsync(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.id);
  sendSuccess(res, { message: 'Item removed from cart', data: { cart } });
});

module.exports = { getCart, addItem, updateItem, removeItem };
