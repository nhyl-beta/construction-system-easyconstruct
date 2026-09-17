import { NextFunction, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { formatSuccess } from "../utils/response.js";
import { logAudit } from "../utils/audit.js";
import type { AuthedRequest } from "../middleware/auth.js";
import * as service from "./service.js";

export const getAll = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAll({ projectCode: req.query.projectCode as string });
    res.json(formatSuccess(data, "Project engineers retrieved"));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.create({
      ...req.body,
      addedBy: req.authUser?.name ?? "unknown",
    });
    await logAudit({
      entityType: "project_engineer",
      entityId: String(data.id),
      action: "created",
      actor: req.authUser?.name ?? "unknown",
      summary: `Marked ${data.userName} available on project ${data.projectCode}`,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, "Project engineer added"));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.remove(Number(req.params.id));
    await logAudit({
      entityType: "project_engineer",
      entityId: String(req.params.id),
      action: "deleted",
      actor: req.authUser?.name ?? "unknown",
      summary: `Removed ${data.userName} from project ${data.projectCode}`,
    });
    res.json(formatSuccess(data, "Project engineer removed"));
  } catch (err) {
    next(err);
  }
};
