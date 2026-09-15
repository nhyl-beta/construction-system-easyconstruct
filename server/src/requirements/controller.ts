import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { RequirementFilters } from "./types.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: RequirementFilters = {
      project: req.query.project as string,
      category: req.query.category as string,
      status: req.query.status as string,
      search: req.query.search as string,
    };
    const data = await service.findAll(filters);
    res.json(formatSuccess(data, MSG.requirements.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.findById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.requirements.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.create(req.body);
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.requirements.created));
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json(formatSuccess(data, MSG.requirements.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.remove(Number(req.params.id));
    res.json(formatSuccess(data, MSG.requirements.deleted));
  } catch (err) {
    next(err);
  }
};