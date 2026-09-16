export const apiClient = {
  get: (path: string) => request(path, { method: "GET" }),

  post: (path: string, body: any) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  postFormData: async (path: string, formData: FormData) => {
    const token =
      sessionStorage.getItem("easyconstruct_token") ??
      localStorage.getItem("easyconstruct_token");

    const url = BASE ? `${BASE}/api${path}` : `/api${path}`;

    const res = await fetch(url, {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();

      let message = `API error ${res.status}`;

      try {
        const json = JSON.parse(text);
        message = json.message ?? message;
      } catch {
        if (text) {
          message = `${message}: ${text}`;
        }
      }

      throw new Error(message);
    }

    const bodyText = await res.text();

    try {
      return bodyText ? JSON.parse(bodyText) : null;
    } catch {
      return bodyText;
    }
  },

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