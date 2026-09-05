import type { Request, Response, NextFunction } from "express";
import * as service from "./service.js";
import { sendSuccess } from "../utils/response.js";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.login(req.body);
    sendSuccess(res, result, 200, "Login successful");
  } catch (err) {
    next(err);
  }
};