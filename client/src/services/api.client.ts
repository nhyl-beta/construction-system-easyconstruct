// Simple fetch-based API client wrapper to avoid adding axios as a dependency in dev.
// Exposes a minimal helper used by repositories.

const BASE = import.meta.env.VITE_API_BASE || "";

async function request(path: string, opts: RequestInit = {}) {
  const url = BASE ? `${BASE}/api${path}` : `/api${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const body = JSON.parse(text) as { message?: string };
      message = body.message ?? text;
    } catch {
      // Preserve the plain response when the server did not return JSON.
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  const bodyText = await res.text();
  try {
    return bodyText ? JSON.parse(bodyText) : null;
  } catch (e) {
    return bodyText;
  }
}

export const apiClient = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body: any) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body: any) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path: string) => request(path, { method: 'DELETE' }),
};
