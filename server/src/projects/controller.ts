import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { ProjectFilters } from "./types.js";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters: ProjectFilters = {
      status: req.query.status as string,
      risk: req.query.risk as string,
      search: req.query.search as string,
    };
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, MSG.projects.retrieved));
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
    res.json(formatSuccess(data, MSG.projects.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.create(req.body);
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.projects.created));
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json(formatSuccess(data, MSG.projects.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.remove(Number(req.params.id));
    res.json(formatSuccess(data, MSG.projects.deleted));
  } catch (err) {
    next(err);
  }
};
