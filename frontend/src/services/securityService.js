import apiClient from './apiClient';

export async function getSecurityEvents(params = {}) {
  const { data } = await apiClient.get('/admin/security/events', { params });
  return { events: data.data.events, meta: data.meta };
}

export async function getBlockedIps() {
  const { data } = await apiClient.get('/admin/security/blocked-ips');
  return data.data.blockedIps;
}

export async function blockIp(ip, reason) {
  const { data } = await apiClient.post('/admin/security/blocked-ips', { ip, reason });
  return data;
}

export async function unblockIp(ip) {
  const { data } = await apiClient.delete(`/admin/security/blocked-ips/${encodeURIComponent(ip)}`);
  return data;
}
