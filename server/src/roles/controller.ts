import { NextFunction, Request, Response } from "express";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import { byString, respondList } from "../utils/pagination.js";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAll();
    respondList(res, req.query, data, MSG.roles.retrieved, {
      name: byString((r) => r.name),
    });
  } catch (err) {
    next(err);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.roles.single));
  } catch (err) {
    next(err);
  }
};
