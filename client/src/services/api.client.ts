/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = import.meta.env.VITE_API_BASE || "";

function authHeader(): Record<string, string> {
  const token =
    sessionStorage.getItem("easyconstruct_token") ??
    localStorage.getItem("easyconstruct_token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

async function parseResponse(res: Response) {
  const text = await res.text();

  if (!res.ok) {
    let message = `API error ${res.status}`;
    let body: unknown;

    try {
      const json = JSON.parse(text);
      message = json.message ?? message;
      body = json;
    } catch {
      if (text) {
        message = `${message}: ${text}`;
      }
    }

    const error = new Error(message) as Error & { status?: number; body?: unknown };
    error.status = res.status;
    // Extra fields an AppError attached (e.g. GateBlockedError's `failing`
    // array) — callers that need more than the message read this instead of
    // re-parsing the string.
    error.body = body;
    throw error;
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function apiUrl(path: string) {
  return BASE ? `${BASE}/api${path}` : `/api${path}`;
}

async function request(
  path: string,
  opts: RequestInit = {},
) {
  const {
    headers: optionHeaders,
    ...rest
  } = opts;

  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(optionHeaders ?? {}),
    },
  });

  return parseResponse(res);
}

async function requestFormData(
  path: string,
  formData: FormData,
) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });

  return parseResponse(res);
}

export const apiClient = {
  get: (path: string, opts: RequestInit = {}) =>
    request(path, {
      ...opts,
      method: "GET",
    }),

  post: (path: string, body: any) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  postFormData: (
    path: string,
    formData: FormData,
  ) => requestFormData(path, formData),

  patch: (path: string, body: any) =>
    request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  del: (path: string) =>
    request(path, {
      method: "DELETE",
    }),
};
