export function hasSession(role = 'user') {
  try {
    const token = localStorage.getItem(role === 'admin' ? 'adminToken' : 'userToken');
    if (!token) return false;
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(encoded));
    return Number.isFinite(claims.exp) && claims.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function storedUser() {
  try { return JSON.parse(localStorage.getItem('userData')) || null; }
  catch { return null; }
}

export function expireSession(role) {
  localStorage.removeItem(role === 'admin' ? 'adminToken' : 'userToken');
  if (role !== 'admin') localStorage.removeItem('userData');
  window.dispatchEvent(new CustomEvent('session-expired', {detail:{role}}));
}
