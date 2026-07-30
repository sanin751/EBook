import apiClient from './apiClient';
import cleanParams from '../utils/cleanParams';

export async function getDashboardSummary() {
  const { data } = await apiClient.get('/admin/dashboard');
  return data.data;
}

export async function getOrdersReport(params = {}) {
  const { data } = await apiClient.get('/reports/orders', { params: cleanParams(params) });
  return { orders: data.data.orders, summary: data.meta };
}

export async function getProductsReport(params = {}) {
  const { data } = await apiClient.get('/reports/products', { params: cleanParams(params) });
  return data.data.products;
}
