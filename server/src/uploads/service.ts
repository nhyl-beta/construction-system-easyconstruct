import { put } from "@vercel/blob";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { env } from "../config/env.js";
import { ValidationError } from "../utils/errors.js";

import type { UploadInput, UploadResult } from "./types.js";

// Same read-only-fs rule as server/src/documents/upload.ts: only os.tmpdir()
// is writable on Vercel.
const uploadDirectory = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads", "generic")
  : path.resolve(process.cwd(), "uploads", "generic");

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

// Photos and PDFs cover attendance/task evidence. Design files are CAD and
// office documents (blueprints.file_type defaults to "DWG"), which the
// image/PDF-only list rejected outright — browsers also report DWG/DXF
// inconsistently, often as application/octet-stream or an empty type, so
// those are matched by extension below rather than MIME alone.
const ALLOWED_PREFIXES = [
  "image/",
  "application/pdf",
  "application/acad",
  "image/vnd.dwg",
  "application/dxf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv",
];

// Extensions trusted when the browser sends a generic or empty MIME type.
const ALLOWED_EXTENSIONS = [
  ".dwg",
  ".dxf",
  ".rvt",
  ".ifc",
  ".skp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
];

function isAllowedUpload(mime: string, filename: string): boolean {
  if (ALLOWED_PREFIXES.some((prefix) => mime.startsWith(prefix))) return true;

  const generic =
    mime === "application/octet-stream" || mime === "" || mime === "application/x-empty";

  if (!generic) return false;

  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function decodeDataUrl(
  dataUrl: string,
): { buffer: Buffer; mime: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);

  if (!match) {
    throw new ValidationError(
      "Expected a base64 data URL",
    );
  }

  const mime = match[1];
  const base64 = match[2];

  if (!mime || !base64) {
    throw new ValidationError(
      "Invalid base64 data URL",
    );
  }

  const buffer = Buffer.from(base64, "base64");

  return {
    buffer,
    mime,
  };
}

export const uploadFile = async (
  input: UploadInput,
): Promise<UploadResult> => {
  const { buffer, mime } = decodeDataUrl(
    input.dataUrl,
  );

  if (!isAllowedUpload(mime, input.filename)) {
    throw new ValidationError(
      `Unsupported file type: ${mime || "unknown"} (${input.filename})`,
    );
  }

  if (buffer.byteLength > MAX_BYTES) {
    throw new ValidationError(
      "File exceeds the 8MB upload limit",
    );
  }

  const contentType = input.contentType || mime;

  if (env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(
        `easyconstruct/${Date.now()}-${input.filename}`,
        buffer,
        {
          access: "public",
          contentType,
          token: env.BLOB_READ_WRITE_TOKEN,
        },
      );

      return {
        url: blob.url,
        filename: input.filename,
        contentType,
        sizeBytes: buffer.byteLength,
      };
    } catch (error) {
      // A token can be present but unusable — most commonly the store is
      // configured for private access while `put` above asks for public,
      // which threw BlobError and surfaced to the user as a bare
      // "Internal server error" on every design-file upload. A misconfigured
      // remote store shouldn't take the feature down: log it once and fall
      // through to local disk, which is served by the same /uploads route.
      console.error(
        "[uploads] Vercel Blob rejected the upload; falling back to local disk.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  // No usable Vercel Blob store (not configured, or it rejected the write) —
  // fall back to the same local-disk storage pattern used by
  // server/src/documents/upload.ts.
  fs.mkdirSync(uploadDirectory, { recursive: true });
  const safeName = input.filename.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const storedName = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}-${safeName}`;
  fs.writeFileSync(path.join(uploadDirectory, storedName), buffer);

  return {
    url: `/uploads/generic/${storedName}`,
    filename: input.filename,
    contentType,
    sizeBytes: buffer.byteLength,
  };
};
