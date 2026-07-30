import apiClient from './apiClient';

export async function register(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data.data;
}

export async function login(payload) {
  const { data } = await apiClient.post('/auth/login', payload);
  return data.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function refresh() {
  const { data } = await apiClient.post('/auth/refresh');
  return data.data;
}

export async function forgotPassword(email) {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await apiClient.post('/auth/reset-password', { token, password });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get('/auth/me');
  return data.data.user;
}

export async function updateProfile(payload) {
  const { data } = await apiClient.patch('/auth/me', payload);
  return data.data.user;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await apiClient.patch('/auth/change-password', { currentPassword, newPassword });
  return data;
}

export async function getCaptcha() {
  const { data } = await apiClient.get('/auth/captcha');
  return data.data;
}

export async function mfaSetup() {
  const { data } = await apiClient.post('/auth/mfa/setup');
  return data.data;
}

export async function mfaVerifySetup(code) {
  const { data } = await apiClient.post('/auth/mfa/verify-setup', { code });
  return data.data;
}

export async function mfaDisable(currentPassword, code) {
  const { data } = await apiClient.post('/auth/mfa/disable', { currentPassword, code });
  return data;
}

export async function mfaLoginVerify(mfaChallengeToken, code) {
  const { data } = await apiClient.post('/auth/mfa/login-verify', { mfaChallengeToken, code });
  return data.data;
}

export async function passwordlessRequest(email) {
  const { data } = await apiClient.post('/auth/passwordless/request', { email });
  return data;
}

export async function passwordlessVerify(token) {
  const { data } = await apiClient.post('/auth/passwordless/verify', { token });
  return data.data;
}
