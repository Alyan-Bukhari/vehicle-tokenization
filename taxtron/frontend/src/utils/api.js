import axios from 'axios';
import {expireSession} from './session';

function handleExpiredSession(url, status, headers) {
  if (status !== 401 || /\/(login|register)$/.test(url.pathname)) return;
  const authorization = new Headers(headers).get('Authorization');
  if (!authorization) return;
  const token = authorization.replace(/^Bearer /i, '');
  for (const role of ['admin', 'user']) {
    if (localStorage.getItem(role === 'admin' ? 'adminToken' : 'userToken') === token) expireSession(role);
  }
}

// Keep credentials on same-origin API requests and preserve explicit caller headers.
export function authHeaders(url) {
  const path = new URL(url, window.location.origin).pathname;
  const admin = window.location.pathname.startsWith('/admin') || path.startsWith('/api/admin/') || path.includes('/admin/');
  const token = localStorage.getItem(admin ? 'adminToken' : 'userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) return originalFetch(input, options);
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(options.headers).forEach((value,key) => headers.set(key,value));
  for (const [key,value] of Object.entries(authHeaders(url.href))) if (!headers.has(key)) headers.set(key,value);
  const response = await originalFetch(input, { ...options, headers });
  handleExpiredSession(url, response.status, headers);
  return response;
};
axios.interceptors.request.use(config => {
  const url = new URL(config.url, window.location.origin);
  if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
    config.headers = { ...authHeaders(url.href), ...config.headers };
  }
  return config;
});
axios.interceptors.response.use(response => response, error => {
  if (error.config?.url) {
    const url = new URL(error.config.url, window.location.origin);
    if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
      handleExpiredSession(url, error.response?.status, error.config.headers);
    }
  }
  return Promise.reject(error);
});
