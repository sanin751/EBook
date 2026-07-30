import apiClient from './apiClient';

export async function getAddresses() {
  const { data } = await apiClient.get('/addresses');
  return data.data.addresses;
}

export async function createAddress(payload) {
  const { data } = await apiClient.post('/addresses', payload);
  return data.data.address;
}

export async function updateAddress(id, payload) {
  const { data } = await apiClient.put(`/addresses/${id}`, payload);
  return data.data.address;
}

export async function deleteAddress(id) {
  await apiClient.delete(`/addresses/${id}`);
}
