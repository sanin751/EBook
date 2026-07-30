import apiClient from './apiClient';

export async function getCart() {
  const { data } = await apiClient.get('/cart');
  return data.data.cart;
}

export async function addToCart(payload) {
  const { data } = await apiClient.post('/cart', payload);
  return data.data.cart;
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await apiClient.put(`/cart/${itemId}`, { quantity });
  return data.data.cart;
}

export async function removeCartItem(itemId) {
  const { data } = await apiClient.delete(`/cart/${itemId}`);
  return data.data.cart;
}
