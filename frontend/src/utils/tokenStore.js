const STORAGE_KEY = 'ebook_access_token';

let accessToken = sessionStorage.getItem(STORAGE_KEY) || null;
let onUnauthorized = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    sessionStorage.setItem(STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  if (onUnauthorized) onUnauthorized();
}
