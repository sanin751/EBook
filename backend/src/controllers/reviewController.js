const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const reviewService = require('../services/reviewService');

const create = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Review created', data: { review } });
});

const listForProduct = catchAsync(async (req, res) => {
  const reviews = await reviewService.listReviewsForProduct(req.params.productId);
  sendSuccess(res, { data: { reviews } });
});

const remove = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.user._id, req.params.id, req.user.role === 'admin');
  sendSuccess(res, { message: 'Review deleted' });
});

module.exports = { create, listForProduct, remove };
