import { NextFunction, Response } from "express";
import { pipeline } from "node:stream/promises";
import { ValidationError } from "../utils/errors.js";
import { HTTP } from "../constants/http-status.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { AuthedRequest } from "../middleware/auth.js";

export const upload = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.uploadFile(req.body);
    res.status(HTTP.CREATED).json(formatSuccess(data, "File uploaded"));
  } catch (err) {
    next(err);
  }
};

// GET /api/uploads/file?url=<stored url>
// Streams any stored file to an authenticated caller. A plain link can't send
// an Authorization header, so the client fetches this with the token and turns
// the response into an object URL (see client lib/file-url.ts).
export const download = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const url = typeof req.query.url === "string" ? req.query.url : "";
    if (!url) throw new ValidationError("url is required");
    const file = await service.openStoredFile(url);
    res.setHeader("Content-Type", file.contentType);
    if (file.sizeBytes != null) res.setHeader("Content-Length", String(file.sizeBytes));
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    await pipeline(file.stream, res);
  } catch (err) {
    next(err);
  }
};
