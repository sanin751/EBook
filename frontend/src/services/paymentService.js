import apiClient from './apiClient';

export async function createPaymentIntent(orderId) {
  const { data } = await apiClient.post('/payments/create-intent', { orderId });
  return data.data;
}

export async function initiateEsewaPayment(orderId) {
  const { data } = await apiClient.post('/payments/esewa/initiate', { orderId });
  return data.data;
}

export async function payWithCod(orderId) {
  const { data } = await apiClient.post('/payments/cod', { orderId });
  return data.data.order;
}
