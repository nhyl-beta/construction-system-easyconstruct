// server/src/workflows/controller.ts
import { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatError, formatSuccess } from "../utils/response.js";
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

export const createTemplate = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const data = await service.createTemplate(req.body);
    await logAudit({
      entityType: "workflow_template",
      entityId: String(data.id),
      action: "created",
      actor,
      summary: `Created workflow template "${data.name}" (${data.defaultStages.length} stages)`,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.workflows.created));
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const data = await service.deleteTemplate(Number(req.params.id));
    await logAudit({
      entityType: "workflow_template",
      entityId: String(data.id),
      action: "deleted",
      actor,
      summary: `Deleted workflow template "${data.name}"`,
    });
    res.json(formatSuccess(data, MSG.workflows.deleted));
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

export const update = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.authUser?.name ?? "unknown";
    const data = await service.updateWorkflow(
      Number(req.params.id),
      req.body,
      req.authUser?.role ?? "",
      actor,
    );
    await logAudit({
      entityType: "workflow",
      entityId: String(data.id),
      action: "updated",
      actor,
      summary: `Updated workflow "${data.title}" (${data.code})`,
    });
    res.json(formatSuccess(data, MSG.workflows.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.authUser?.name ?? "unknown";
    const data = await service.deleteWorkflow(
      Number(req.params.id),
      req.authUser?.role ?? "",
      actor,
    );
    await logAudit({
      entityType: "workflow",
      entityId: String(data.id),
      action: "deleted",
      actor,
      summary: `Deleted workflow "${data.title}" (${data.code})`,
    });
    res.json(formatSuccess(data, MSG.workflows.deleted));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const createdBy = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const data = await service.createWorkflow(req.body, createdBy, req.authUser?.role);
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

export const resubmitStage = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const actor = { role: req.authUser?.role ?? "", name: req.authUser?.name ?? "unknown" };
    const data = await service.resubmitStage(
      Number(req.params.id),
      Number(req.params.stageId),
      { attachment: req.body?.attachment },
      actor,
    );
    await logAudit({
      entityType: "workflow_stage",
      entityId: String(req.params.stageId),
      action: "resubmitted",
      actor: actor.name,
      summary: `Resubmitted stage on workflow "${data.title}" (${data.code})`,
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
export const addAttachment = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const data = await service.addAttachment(Number(req.params.id), req.body, actor);
    await logAudit({
      entityType: "workflow",
      entityId: String(req.params.id),
      action: "updated",
      actor,
      summary: `Filed "${req.body.label}" against workflow "${data.title}" (${data.code})`,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.workflows.updated));
  } catch (err) {
    next(err);
  }
};

// Upload path for the same thing: multipart instead of a JSON fileUrl, so
// roles without a documents page (HR, Engineer, Architect) can attach a file
// to a workflow without going through the documents module's own role gate.
export const uploadAttachment = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res
        .status(HTTP.BAD_REQUEST)
        .json(formatError("Please select a file to upload.", "FILE_REQUIRED"));
    }

    const actor = req.authUser?.name ?? req.authUser?.email ?? "unknown";
    const sizeInMb = req.file.size / (1024 * 1024);
    const fileSize =
      sizeInMb >= 1
        ? `${sizeInMb.toFixed(2)} MB`
        : `${Math.max(1, Math.round(req.file.size / 1024))} KB`;

    const data = await service.addAttachment(
      Number(req.params.id),
      {
        kind: "document",
        label: String(req.body.label ?? "").trim() || req.file.originalname,
        content: req.body.content ? String(req.body.content) : undefined,
        fileUrl: `/uploads/documents/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize,
      },
      actor,
    );

    await logAudit({
      entityType: "workflow",
      entityId: String(req.params.id),
      action: "updated",
      actor,
      summary: `Attached file "${req.file.originalname}" to workflow "${data.title}" (${data.code})`,
    });

    return res.status(HTTP.CREATED).json(formatSuccess(data, MSG.workflows.updated));
  } catch (err) {
    return next(err);
  }
};

// Finance's budget-change review: every request raised from the Budget Change
// Request template, each carrying the line items behind its headline amount.
export const getBudgetChangeRequests = async (
  _req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getWorkflowsByTemplateName("Budget Change Request");
    res.json(formatSuccess(data, MSG.workflows.retrieved));
  } catch (err) {
    next(err);
  }
};
