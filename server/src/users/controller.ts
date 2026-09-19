import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { AuthedRequest } from "../middleware/auth.js";
import { logAudit } from "../utils/audit.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { UserFilters } from "./types.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: UserFilters = { role: req.query.role as string };
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, "Users retrieved"));
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
      entityType: "user",
      entityId: String(data.id),
      action: "created",
      actor: req.authUser?.name ?? "unknown",
      summary: `Created account ${data.email} with role ${data.role}`,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, "User created"));
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
      entityType: "user",
      entityId: String(req.params.id),
      action: "updated",
      actor: req.authUser?.name ?? "unknown",
      summary: `Updated account ${data.email} (role ${data.role})`,
    });
    res.json(formatSuccess(data, "User updated"));
  } catch (err) {
    next(err);
  }
};

export const setStatus = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { isActive } = req.body as { isActive: boolean };
    const data = await service.setActive(
      Number(req.params.id),
      isActive,
      req.authUser!.id,
    );
    await logAudit({
      entityType: "user",
      entityId: String(req.params.id),
      action: "updated",
      actor: req.authUser?.name ?? "unknown",
      summary: `${isActive ? "Reactivated" : "Deactivated"} account ${data.email}`,
    });
    res.json(
      formatSuccess(data, isActive ? "User reactivated" : "User deactivated"),
    );
  } catch (err) {
    next(err);
  }
};
