// controller.ts
import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAll({ category: req.query.category as string, search: req.query.search as string });
    res.json(formatSuccess(data, MSG.architectDocuments.retrieved));
  } catch (err) { next(err); }
};
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.getById(Number(req.params.id)), MSG.architectDocuments.single)); }
  catch (err) { next(err); }
};
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.create(req.body);
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.architectDocuments.created));
  } catch (err) { next(err); }
};
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.update(Number(req.params.id), req.body), MSG.architectDocuments.updated)); }
  catch (err) { next(err); }
};
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.remove(Number(req.params.id)), MSG.architectDocuments.deleted)); }
  catch (err) { next(err); }
};