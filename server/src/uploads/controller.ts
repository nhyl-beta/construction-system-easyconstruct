import { NextFunction, Response } from "express";
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