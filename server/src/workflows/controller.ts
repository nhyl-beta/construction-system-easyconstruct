// server/src/workflows/controller.ts
import { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import { logAudit } from "../utils/audit.js";
import * as service from "./service.js";
import type { ApprovalScope } from "./types.js";

export const getTemplates = async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getTemplates();
    res.json(formatSuccess(data, MSG.workflows.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getAll = async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getActiveWorkflows();
    res.json(formatSuccess(data, MSG.workflows.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getWorkflowById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.workflows.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const createdBy = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const data = await service.createWorkflow(req.body, createdBy);
    await logAudit({
      entityType: "workflow",
      entityId: String(data.id),
      action: "created",
      actor: createdBy,
      summary: `Started workflow "${data.title}" (${data.code}) for project ${data.projectCode}`,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.workflows.created));
  } catch (err) {
    next(err);
  }
};

export const decideStage = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const decidedBy = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const requesterRole = req.authUser?.role ?? "";
    const data = await service.decideStage(
      Number(req.params.id),
      Number(req.params.stageId),
      { ...req.body, decidedBy },
      requesterRole,
    );
    await logAudit({
      entityType: "workflow_stage",
      entityId: String(req.params.stageId),
      action: req.body.decision === "approve" ? "approved" : req.body.decision === "reject" ? "rejected" : "revision-requested",
      actor: decidedBy,
      summary: `Decided stage on workflow "${data.title}" (${data.code}): ${req.body.decision}`,
    });
    res.json(formatSuccess(data, MSG.workflowStages.updated));
  } catch (err) {
    next(err);
  }
};

export const getApprovals = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const scope = (req.query.scope as ApprovalScope) ?? "pending";
    const role = req.authUser?.role ?? "";
    const name = req.authUser?.name ?? req.authUser?.email ?? "";
    const data = await service.getApprovalQueue(scope, role, name);
    res.json(formatSuccess(data, MSG.workflows.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getApprovalStats = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.authUser?.role ?? "";
    const name = req.authUser?.name ?? req.authUser?.email ?? "";
    const data = await service.getApprovalStats(role, name);
    res.json(formatSuccess(data, MSG.workflows.retrieved));
  } catch (err) {
    next(err);
  }
};