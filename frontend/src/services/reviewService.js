import apiClient from './apiClient';

export async function getProductReviews(productId) {
  const { data } = await apiClient.get(`/reviews/${productId}`);
  return data.data.reviews;
}

export async function createReview(payload) {
  const { data } = await apiClient.post('/reviews', payload);
  return data.data.review;
}

export async function deleteReview(reviewId) {
  await apiClient.delete(`/reviews/${reviewId}`);
}
