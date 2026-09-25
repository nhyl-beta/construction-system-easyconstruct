// server/src/issues/controller.ts — NEW
import { NextFunction, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import { logAudit } from "../utils/audit.js";
import * as service from "./service.js";
import type { AuthedRequest } from "../middleware/auth.js";
import type { IssueFilters } from "./types.js";

export const getAll = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const filters: IssueFilters = {
      projectCode: req.query.projectCode as string,
      status: req.query.status as string,
      // NOTE: was comparing against "site_personnel" (underscore) while every
      // JWT/requireRole check in this codebase uses "site-personnel"
      // (hyphen) — the scoping never applied. Fixed to the real role string.
      reportedByUserId:
        req.authUser?.role === "site-personnel" ? req.authUser.id : undefined,
    };
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, MSG.issues.retrieved));
  } catch (err) {
    next(err);
  }
};

// ai-signals E5
export const getPrecedents = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getPrecedentsByCategory(req.params.category as string);
    res.json(formatSuccess(data, "Issue precedents retrieved"));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.issues.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.create({
      ...req.body,
      reportedByUserId: req.authUser!.id,
      reportedByName: req.body.reportedByName ?? req.authUser!.email,
      reportedByRole: req.authUser!.role,
    });
    await logAudit({
      entityType: "issue",
      entityId: String(data.id),
      action: "created",
      actor: req.authUser?.name ?? "unknown",
      summary: `Reported issue "${data.title}" for project ${data.projectCode}`,
      projectCode: data.projectCode,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.issues.created));
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.updateStatus(
      Number(req.params.id),
      req.body.status,
      req.body.resolutionNotes,
      req.authUser!.role,
    );
    await logAudit({
      entityType: "issue",
      entityId: String(req.params.id),
      action: req.body.status === "Resolved" ? "resolved" : "updated",
      actor: req.authUser?.name ?? "unknown",
      summary: `Issue "${data.title}" status changed to ${req.body.status}`,
      projectCode: data.projectCode,
    });
    res.json(formatSuccess(data, MSG.issues.updated));
  } catch (err) {
    next(err);
  }
};