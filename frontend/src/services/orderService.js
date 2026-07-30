import apiClient from './apiClient';

export async function createOrder(shippingAddress) {
  const { data } = await apiClient.post('/orders', { shippingAddress });
  return data.data.order;
}

export async function getOrders() {
  const { data } = await apiClient.get('/orders');
  return data.data.orders;
}

export async function getOrder(id) {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data.order;
}

export async function getAllOrders() {
  const { data } = await apiClient.get('/orders/admin/all');
  return data.data.orders;
}

export async function updateOrderStatus(id, status) {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
  return data.data.order;
}
