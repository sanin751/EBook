const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const wishlistService = require('../services/wishlistService');

const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user._id);
  sendSuccess(res, { data: { wishlist } });
});

const addProduct = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.addProduct(req.user._id, req.body.productId);
  sendSuccess(res, { statusCode: 201, message: 'Added to wishlist', data: { wishlist } });
});

const removeProduct = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.removeProduct(req.user._id, req.params.productId);
  sendSuccess(res, { message: 'Removed from wishlist', data: { wishlist } });
});

const moveToCart = catchAsync(async (req, res) => {
  const cart = await wishlistService.moveToCart(req.user._id, req.params.productId, req.body.quantity || 1);
  sendSuccess(res, { message: 'Moved to cart', data: { cart } });
});

module.exports = { getWishlist, addProduct, removeProduct, moveToCart };
