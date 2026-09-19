// Shared resolution for stored file URLs (documents, design files, attendance
// photos, advisory docs).
//
// Uploaded files are stored either as an absolute provider URL (Vercel Blob)
// or as a path relative to the API origin ("/uploads/documents/x.pdf"). A
// relative path must be resolved against the API origin, not the browser's:
//   - in dev the client is on :5173 and the API on :8000, so an unresolved
//     "/uploads/..." hits Vite, falls through to the SPA shell, and React
//     Router renders the catch-all — the reported "Page Not Found", or a
//     bounce to /login when the new tab has no sessionStorage token.
//   - in production the two can be deployed to different origins, which
//     VITE_API_BASE already describes for XHR (see services/api.client.ts).
// vite.config.ts also proxies /uploads so the dev path works when
// VITE_API_BASE is empty.

/**
 * True when `url` points at a file that can actually be fetched — as opposed
 * to the `local-upload-...` placeholder stored when no file-storage provider
 * is configured (see upload-document-dialog.tsx).
 */
export function isRealFileUrl(url: string | null | undefined): boolean {
  return !!url && (/^https?:\/\//.test(url) || url.startsWith("/"));
}

/** Resolve a stored file URL to something the browser can open. */
export function resolveFileUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${import.meta.env.VITE_API_BASE || ""}${url}`;
}

/** Open a stored file in a new tab, resolving it first. */
export function openFileUrl(url: string | null | undefined): void {
  if (!isRealFileUrl(url)) return;
  window.open(resolveFileUrl(url as string), "_blank", "noopener,noreferrer");
}
