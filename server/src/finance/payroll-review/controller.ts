import type { Request, Response, NextFunction } from "express";

import * as service from "./service.js";
import { sendSuccess } from "../../utils/response.js";
import { logAudit } from "../../utils/audit.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { byDate, byString, respondList } from "../../utils/pagination.js";

/**
 * Route parameters
 * Used by endpoints with a route like:
 * GET    /payroll-batches/:id
 * PATCH  /payroll-batches/:id
 */
type PayrollBatchParams = {
  id: string;
};

export const listPayrollBatches = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, projectCode } = req.query;

    const batches = await service.listPayrollBatches({
      status: status as string | undefined,
      projectCode: projectCode as string | undefined,
    });

    return respondList(res, req.query, batches, "OK", {
      createdAt: byDate((b) => b.createdAt),
      period: byString((b) => b.period),
      status: byString((b) => b.status),
      projectCode: byString((b) => b.projectCode),
    });
  } catch (err) {
    return next(err);
  }
};

export const getPayrollBatch = async (
  req: Request<PayrollBatchParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const batch = await service.getPayrollBatch(req.params.id);

    return sendSuccess(res, batch);
  } catch (err) {
    return next(err);
  }
};

export const decidePayrollBatch = async (
  req: AuthedRequest & Request<PayrollBatchParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actor = {
      name: req.authUser?.name ?? "unknown",
      role: req.authUser?.role ?? "",
    };
    const { reviewedBy: _ignored, ...input } = req.body;
    const batch = await service.decidePayrollBatch(req.params.id, input, actor);

    await logAudit({
      entityType: "payroll_batch",
      entityId: req.params.id,
      action: req.body.decision,
      actor: actor.name,
      summary: `Payroll batch ${req.params.id} ${req.body.decision}${
        req.body.reasonCode ? ` (${req.body.reasonCode})` : ""
      }`,
      projectCode: batch.projectCode ?? undefined,
    });

    return sendSuccess(
      res,
      batch,
      200,
      "Payroll batch decision recorded",
    );
  } catch (err) {
    return next(err);
  }
};