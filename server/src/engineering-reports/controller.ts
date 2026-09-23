import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import type { AuthedRequest } from "../middleware/auth.js";
import * as service from "./service.js";
import type { EngineeringReportFilters } from "./types.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: EngineeringReportFilters = {
      project: req.query.project as string,
      type: req.query.type as string,
      status: req.query.status as string,
      search: req.query.search as string,
    };
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, MSG.engineeringReports.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.engineeringReports.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.create(req.body);
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.engineeringReports.created));
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.update(
      Number(req.params.id),
      req.body,
      req.authUser?.role ?? "",
    );
    res.json(formatSuccess(data, MSG.engineeringReports.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.remove(Number(req.params.id));
    res.json(formatSuccess(data, MSG.engineeringReports.deleted));
  } catch (err) {
    next(err);
  }
};