/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/services/api.client.ts — PATCHED (add auth header; used by all new feature repositories)
const BASE = import.meta.env.VITE_API_BASE || "";

function authHeader(): Record<string, string> {
  const token =
    sessionStorage.getItem("easyconstruct_token") ??
    localStorage.getItem("easyconstruct_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, opts: RequestInit = {}) {
  const url = BASE ? `${BASE}/api${path}` : `/api${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...authHeader() },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const bodyText = await res.text();
  try {
    return bodyText ? JSON.parse(bodyText) : null;
  } catch (e) {
    return bodyText;
  }
}

export const apiClient = {
  get: (path: string) => request(path, { method: "GET" }),
  post: (path: string, body: any) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path: string, body: any) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path: string) => request(path, { method: "DELETE" }),
};