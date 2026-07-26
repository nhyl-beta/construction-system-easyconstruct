// controller.ts
import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAll({ folder: req.query.folder as string, search: req.query.search as string });
    res.json(formatSuccess(data, MSG.blueprints.retrieved));
  } catch (err) { next(err); }
};
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.getById(Number(req.params.id)), MSG.blueprints.single)); }
  catch (err) { next(err); }
};
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.create(req.body);
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.blueprints.created));
  } catch (err) { next(err); }
};
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.update(Number(req.params.id), req.body), MSG.blueprints.updated)); }
  catch (err) { next(err); }
};
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.remove(Number(req.params.id)), MSG.blueprints.deleted)); }
  catch (err) { next(err); }
};