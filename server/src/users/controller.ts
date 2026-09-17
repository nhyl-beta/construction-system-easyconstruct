import { NextFunction, Request, Response } from "express";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { UserFilters } from "./types.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: UserFilters = { role: req.query.role as string };
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, "Users retrieved"));
  } catch (err) {
    next(err);
  }
};
