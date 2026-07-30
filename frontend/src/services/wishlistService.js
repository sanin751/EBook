import apiClient from './apiClient';

export async function getWishlist() {
  const { data } = await apiClient.get('/wishlist');
  return data.data.wishlist;
}

export async function addToWishlist(productId) {
  const { data } = await apiClient.post('/wishlist', { productId });
  return data.data.wishlist;
}

export async function removeFromWishlist(productId) {
  const { data } = await apiClient.delete(`/wishlist/${productId}`);
  return data.data.wishlist;
}

export async function moveToCart(productId, quantity = 1) {
  const { data } = await apiClient.post(`/wishlist/${productId}/move-to-cart`, { quantity });
  return data.data.cart;
}
