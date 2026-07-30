import apiClient from './apiClient';
import cleanParams from '../utils/cleanParams';

export async function getProducts(params = {}) {
  const { data } = await apiClient.get('/products', { params: cleanParams(params) });
  return { products: data.data.products, meta: data.meta };
}

export async function getProduct(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data.product;
}

export async function compareProducts(ids) {
  const { data } = await apiClient.get('/products/compare', { params: { ids: ids.join(',') } });
  return data.data.products;
}

function buildProductFormData(values) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key === 'images') {
      (value || []).forEach((file) => formData.append('images', file));
      return;
    }
    if (value === undefined || value === null || value === '') return;
    formData.append(key, value);
  });
  return formData;
}

export async function createProduct(values) {
  // Let axios set the multipart Content-Type (with boundary) itself from the FormData instance.
  const { data } = await apiClient.post('/products', buildProductFormData(values));
  return data.data.product;
}

export async function updateProduct(id, values) {
  const { data } = await apiClient.put(`/products/${id}`, buildProductFormData(values));
  return data.data.product;
}

export async function deleteProduct(id) {
  await apiClient.delete(`/products/${id}`);
}
