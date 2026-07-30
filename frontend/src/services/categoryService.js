import apiClient from './apiClient';

export async function getCategories() {
  const { data } = await apiClient.get('/categories');
  return data.data.categories;
}

export async function getCategory(id) {
  const { data } = await apiClient.get(`/categories/${id}`);
  return data.data.category;
}

export async function createCategory(values) {
  const { data } = await apiClient.post('/categories', values);
  return data.data.category;
}

export async function updateCategory(id, values) {
  const { data } = await apiClient.put(`/categories/${id}`, values);
  return data.data.category;
}

export async function deleteCategory(id) {
  await apiClient.delete(`/categories/${id}`);
}
