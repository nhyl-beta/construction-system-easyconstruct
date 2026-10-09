import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import { logAudit } from "../utils/audit.js";
import * as service from "./service.js";
import type { EmployeeFilters } from "./types.js";
import { AuthedRequest } from "../middleware/auth.js";
import { parsePageRequest, sendPaged } from "../utils/pagination.js";
import { EMPLOYEE_SORT_COLUMNS } from "./repository.js";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters: EmployeeFilters = {
      search: req.query.search as string,
      employeeId: typeof req.query.employeeId === "string" && req.query.employeeId ? req.query.employeeId : undefined,
      department: req.query.department as string,
      status: req.query.status as string,
    };
    const paging = parsePageRequest(req.query, { sortable: Object.keys(EMPLOYEE_SORT_COLUMNS), defaultOrder: "asc" });
    if (paging.requested) {
      const { items, meta } = await service.getPage(filters, paging);
      sendPaged(res, items, MSG.employees.retrieved, meta);
      return;
    }
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, MSG.employees.retrieved));
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
    res.json(formatSuccess(data, MSG.employees.single));
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getMyEmployeeRecord(req.authUser!.id, req.authUser!.email);
    res.json(formatSuccess(data, MSG.employees.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.create(req.body);
    await logAudit({
      entityType: "employee",
      entityId: String(data.id),
      action: "created",
      actor: req.authUser?.name ?? "unknown",
      summary: `Added employee ${data.name}`,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.employees.created));
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    await logAudit({
      entityType: "employee",
      entityId: String(req.params.id),
      action: "updated",
      actor: req.authUser?.name ?? "unknown",
      summary: `Updated employee ${data.name}`,
    });
    res.json(formatSuccess(data, MSG.employees.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.remove(Number(req.params.id));
    await logAudit({
      entityType: "employee",
      entityId: String(req.params.id),
      action: "deleted",
      actor: req.authUser?.name ?? "unknown",
      summary: `Removed employee ${data.name}`,
    });
    res.json(formatSuccess(data, MSG.employees.deleted));
  } catch (err) {
    next(err);
  }
};

export const deactivate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.deactivate(Number(req.params.id));
    res.json(formatSuccess(data, "Employee deactivated"));
  } catch (err) {
    next(err);
  }
};
