// Shared resolution for stored file URLs (documents, design files, attendance
// photos, advisory docs).
//
// Stored files live in one of two places:
//   - a PRIVATE Vercel Blob store (absolute blob URL), or
//   - local disk ("/uploads/..." path) in development.
// Neither is fetchable by a bare link any more: a new tab carries no
// Authorization header, which is exactly how "Download" used to land on the
// login page. Both are read through GET /api/uploads/file, which checks the
// caller's token and streams the bytes. Because that needs a header, the
// client fetches the file with the token and hands the browser an object URL.
import { useEffect, useState } from "react";
import { apiClient } from "@/services/api.client";

const isBlobHost = (url: string) => {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
};

/**
 * True when `url` points at a file that can actually be fetched — as opposed
 * to the `local-upload-...` placeholder stored when no file-storage provider
 * is configured (see upload-document-dialog.tsx).
 */
export function isRealFileUrl(url: string | null | undefined): boolean {
  return !!url && (/^https?:\/\//.test(url) || url.startsWith("/"));
}

/** Files that must go through the authenticated download route. */
function needsAuthFetch(url: string): boolean {
  return url.startsWith("/") || isBlobHost(url);
}

/** Fetch a stored file's bytes with the caller's credentials. */
export async function fetchFileBlob(url: string): Promise<Blob> {
  if (needsAuthFetch(url)) {
    return apiClient.getBlob(`/uploads/file?url=${encodeURIComponent(url)}`);
  }
  // Legacy public URL on another host — no credentials needed or wanted.
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load file (${res.status})`);
  return res.blob();
}

/** Open a stored file in a new tab. */
export async function openFileUrl(url: string | null | undefined): Promise<void> {
  if (!isRealFileUrl(url)) return;
  // Open the tab synchronously so popup blockers treat it as user-initiated,
  // then point it at the object URL once the authenticated fetch resolves.
  const tab = window.open("", "_blank");
  try {
    const blob = await fetchFileBlob(url as string);
    const objectUrl = URL.createObjectURL(blob);
    if (tab) tab.location.href = objectUrl;
    else window.location.href = objectUrl;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

/** Download a stored file under `filename`. */
export async function downloadFileUrl(
  url: string | null | undefined,
  filename?: string,
): Promise<void> {
  if (!isRealFileUrl(url)) return;
  const blob = await fetchFileBlob(url as string);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename ?? decodeURIComponent((url as string).split(/[?#]/)[0]!.split("/").pop() ?? "file");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

/**
 * Object URL for displaying a stored file inline (<img>, <iframe>). `error`
 * is set when the file is missing or the caller may not read it.
 */
export function useFileObjectUrl(url: string | null | undefined, enabled = true) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !isRealFileUrl(url)) {
      setObjectUrl(null);
      setError(null);
      setLoading(false);
      return;
    }
    let active = true;
    let created: string | null = null;
    setLoading(true);
    setError(null);
    fetchFileBlob(url as string)
      .then((blob) => {
        if (!active) return;
        created = URL.createObjectURL(blob);
        setObjectUrl(created);
      })
      .catch((err: Error) => {
        if (active) {
          setObjectUrl(null);
          setError(err);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [url, enabled]);

  return { objectUrl, error, loading };
}

/** Saves a Blob the app already holds (e.g. a generated template) as a download. */
export function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
