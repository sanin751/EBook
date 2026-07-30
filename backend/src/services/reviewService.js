const Review = require('../models/Review');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

async function createReview(userId, { productId, rating, comment }) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw ApiError.notFound('Product not found');
  }

  const existing = await Review.findOne({ product: productId, user: userId });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  return Review.create({ product: productId, user: userId, rating, comment });
}

async function listReviewsForProduct(productId) {
  return Review.find({ product: productId }).populate('user', 'name').sort('-createdAt');
}

async function deleteReview(userId, reviewId, isAdmin = false) {
  const review = await Review.findById(reviewId);
  if (!review) throw ApiError.notFound('Review not found');
  if (!isAdmin && review.user.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only delete your own reviews');
  }
  await Review.findOneAndDelete({ _id: reviewId });
}

module.exports = { createReview, listReviewsForProduct, deleteReview };
