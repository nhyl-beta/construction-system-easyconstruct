import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HTTP } from "../constants/http-status.js";
import { AppError } from "../utils/errors.js";
import { formatError } from "../utils/response.js";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    const statusCode =
      err.code === "LIMIT_FILE_SIZE"
        ? 413
        : 400;

    res.status(statusCode).json(
      formatError(
        err.code === "LIMIT_FILE_SIZE"
          ? "The uploaded file is too large. Maximum size is 10 MB."
          : err.message,
        err.code === "LIMIT_FILE_SIZE"
          ? "FILE_TOO_LARGE"
          : "UPLOAD_ERROR",
      ),
    );
    return;
  }

  if (
    err.message.startsWith(
      "Unsupported file type.",
    )
  ) {
    res.status(400).json(
      formatError(
        err.message,
        "UNSUPPORTED_FILE_TYPE",
      ),
    );
    return;
  }

  // body-parser rejecting an oversized JSON body (a base64 upload past the
  // limit set in app.ts). Without this it reached the generic branch below
  // and reported as a 500, which read as a server crash rather than "your
  // file is too big".
  if ((err as { type?: string }).type === "entity.too.large") {
    res.status(413).json(
      formatError(
        "The uploaded file is too large. Maximum size is 8 MB.",
        "FILE_TOO_LARGE",
      ),
    );
    return;
  }

  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ ...formatError(err.message, err.code), ...err.extra });
    return;
  }

  // Postgres unique-violation (e.g. a duplicate project/document/requirement
  // code) — surface as a 409 instead of falling through to a bare 500.
  // drizzle-orm wraps the raw pg error, so the pg error code/detail live on
  // `.cause`, not the top-level error, for query errors it throws.
  const pgError = (err as { cause?: { code?: string; detail?: string } }).cause;
  const pgCode = (err as { code?: string }).code ?? pgError?.code;
  if (pgCode === "23505") {
    const detail = (err as { detail?: string }).detail ?? pgError?.detail;
    res.status(409).json(
      formatError(
        detail ?? "A record with these details already exists.",
        "CONFLICT",
      ),
    );
    return;
  }

  console.error("[Unhandled]", err);
  res
    .status(HTTP.SERVER_ERROR)
    .json(formatError("Internal server error", "SERVER_ERROR"));
}
