import { NextFunction, Request, Response } from "express";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import { cached } from "../cache/index.js";
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
    // Aggregate over employees, attendance and payroll, same for every caller. 60 s.
    const data = await cached("reports", "all", 60, () => service.getSummary(filters), {
      query: filters,
      deps: ["employees", "attendance", "payroll"],
    });
    res.json(formatSuccess(data, "Workforce summary retrieved"));
  } catch (err) {
    next(err);
  }
};
