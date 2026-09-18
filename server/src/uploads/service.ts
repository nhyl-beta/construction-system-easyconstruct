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

const ALLOWED_PREFIXES = [
  "image/",
  "application/pdf",
];

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

  if (
    !ALLOWED_PREFIXES.some((prefix) =>
      mime.startsWith(prefix),
    )
  ) {
    throw new ValidationError(
      `Unsupported file type: ${mime}`,
    );
  }

  if (buffer.byteLength > MAX_BYTES) {
    throw new ValidationError(
      "File exceeds the 8MB upload limit",
    );
  }

  const contentType = input.contentType || mime;

  if (env.BLOB_READ_WRITE_TOKEN) {
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
  }

  // No Vercel Blob store connected (e.g. local dev) — fall back to the same
  // local-disk storage pattern used by server/src/documents/upload.ts.
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
