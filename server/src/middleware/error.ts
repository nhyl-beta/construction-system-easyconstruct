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

  if (err instanceof AppError) {
    res.status(err.statusCode).json(formatError(err.message, err.code));
    return;
  }
  console.error("[Unhandled]", err);
  res
    .status(HTTP.SERVER_ERROR)
    .json(formatError("Internal server error", "SERVER_ERROR"));
}
