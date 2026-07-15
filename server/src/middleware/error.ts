import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { AppError } from "../utils/errors.js";
import { formatError } from "../utils/response.js";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(formatError(err.message, err.code));
    return;
  }
  console.error("[Unhandled]", err);
  res
    .status(HTTP.SERVER_ERROR)
    .json(formatError("Internal server error", "SERVER_ERROR"));
}
