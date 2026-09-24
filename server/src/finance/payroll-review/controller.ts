import type { Request, Response, NextFunction } from "express";

import * as service from "./service.js";
import { sendSuccess } from "../../utils/response.js";
import { logAudit } from "../../utils/audit.js";
import type { AuthedRequest } from "../../middleware/auth.js";

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

    return sendSuccess(res, batches);
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

export const createPayrollBatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const batch = await service.createPayrollBatch(req.body);

    return sendSuccess(res, batch, 201, "Payroll batch created");
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
    const batch = await service.decidePayrollBatch(
      req.params.id,
      req.body,
    );

    await logAudit({
      entityType: "payroll_batch",
      entityId: req.params.id,
      action: req.body.decision,
      actor: req.authUser?.name ?? req.body.reviewedBy ?? "unknown",
      summary: `Payroll batch ${req.params.id} ${req.body.decision}`,
      projectCode: batch?.projectCode ?? undefined,
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