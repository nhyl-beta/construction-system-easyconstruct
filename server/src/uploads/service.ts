import { put } from "@vercel/blob";

import { env } from "../config/env.js";
import { ValidationError } from "../utils/errors.js";

import type { UploadInput, UploadResult } from "./types.js";

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
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new ValidationError(
      "File storage is not configured — set BLOB_READ_WRITE_TOKEN (connect a Vercel Blob store to this project).",
    );
  }

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

  const blob = await put(
    `easyconstruct/${Date.now()}-${input.filename}`,
    buffer,
    {
      access: "public",
      contentType: input.contentType || mime,
      token: env.BLOB_READ_WRITE_TOKEN,
    },
  );

  return {
    url: blob.url,
    filename: input.filename,
    contentType: input.contentType || mime,
    sizeBytes: buffer.byteLength,
  };
};
