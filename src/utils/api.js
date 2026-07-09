export const API_BASE = 'http://localhost:5000';

// Wraps fetch with the API base URL and JSON handling.
// Pass a token to automatically attach the Authorization header.
export async function apiFetch(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}
