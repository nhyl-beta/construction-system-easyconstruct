// server/src/milestones/controller.ts — NEW
import { NextFunction, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import { logAudit } from "../utils/audit.js";
import * as service from "./service.js";
import type { AuthedRequest } from "../middleware/auth.js";

export const getAll = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAll(req.query.projectCode as string | undefined);
    res.json(formatSuccess(data, MSG.milestones.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.milestones.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const createdBy = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const data = await service.create(req.body, createdBy);
    await logAudit({
      entityType: "milestone",
      entityId: String(data.id),
      action: "created",
      actor: createdBy,
      summary: `Created draft milestone "${data.title}" for project ${data.projectCode}`,
      projectCode: data.projectCode,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.milestones.created));
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const data = await service.update(Number(req.params.id), req.body);
    await logAudit({
      entityType: "milestone",
      entityId: String(data.id),
      action: "updated",
      actor,
      summary: `Updated milestone "${data.title}"`,
      projectCode: data.projectCode,
    });
    res.json(formatSuccess(data, MSG.milestones.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const data = await service.remove(Number(req.params.id));
    await logAudit({
      entityType: "milestone",
      entityId: String(req.params.id),
      action: "deleted",
      actor,
      summary: `Deleted milestone "${data.title}"`,
      projectCode: data.projectCode,
    });
    res.json(formatSuccess(data, MSG.milestones.deleted));
  } catch (err) {
    next(err);
  }
};

export const createLink = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.createLink(
      Number(req.params.id),
      req.body,
      req.authUser?.role ?? "",
    );
    await logAudit({
      entityType: "milestone",
      entityId: String(req.params.id),
      action: "linked",
      actor: req.authUser?.name ?? "unknown",
      summary: `Linked ${req.body.linkType} #${req.body.linkId} to milestone "${data.title}"`,
      projectCode: data.projectCode,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.milestones.updated));
  } catch (err) {
    next(err);
  }
};

export const removeLink = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.removeLink(
      Number(req.params.id),
      Number(req.params.linkId),
      req.authUser?.role ?? "",
    );
    await logAudit({
      entityType: "milestone",
      entityId: String(req.params.id),
      action: "unlinked",
      actor: req.authUser?.name ?? "unknown",
      summary: `Removed link #${req.params.linkId} from milestone "${data.title}"`,
      projectCode: data.projectCode,
    });
    res.json(formatSuccess(data, MSG.milestones.updated));
  } catch (err) {
    next(err);
  }
};
