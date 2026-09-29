import { NextFunction, Request, Response } from "express";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";

const str = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);
const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return typeof v === "string" && v.length > 0 && Number.isFinite(n) ? n : undefined;
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getAll({
      entityType: str(req.query.entityType),
      entityId: str(req.query.entityId),
      projectCode: str(req.query.projectCode),
      search: str(req.query.search),
      actor: str(req.query.actor),
      dateFrom: str(req.query.dateFrom),
      dateTo: str(req.query.dateTo),
      page: num(req.query.page),
      perPage: num(req.query.perPage),
    });
    res.json(formatSuccess(result, MSG.auditLogs.retrieved));
  } catch (err) { next(err); }
};

export const getFacets = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getFacets();
    res.json(formatSuccess(data, "Activity log filters retrieved"));
  } catch (err) { next(err); }
};
export const getSecurityOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getSecurityOverview();
    res.json(formatSuccess(data, "Security overview retrieved"));
  } catch (err) {
    next(err);
  }
};
