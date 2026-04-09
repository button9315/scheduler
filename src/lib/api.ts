const API_BASE = '/api';

async function request(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '오류가 발생했습니다');
  }
  return res.json();
}

export const api = {
  get: (url: string) => request(url),
  post: (url: string, body?: any) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url: string, body?: any) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url: string, body?: any) => request(url, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};
