import { NextFunction, Request, Response } from "express";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { WorkforceReportFilters } from "./service.js";

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: WorkforceReportFilters = {
      department: req.query.department as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      period: req.query.period as string,
    };
    const data = await service.getSummary(filters);
    res.json(formatSuccess(data, "Workforce summary retrieved"));
  } catch (err) {
    next(err);
  }
};
