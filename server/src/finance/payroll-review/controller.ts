import type { Request, Response, NextFunction } from "express";

import * as service from "./service.js";
import { sendSuccess } from "../../utils/response.js";

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

    sendSuccess(res, batches);
  } catch (err) {
    next(err);
  }
};

export const getPayrollBatch = async (
  req: Request<PayrollBatchParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const batch = await service.getPayrollBatch(req.params.id);

    sendSuccess(res, batch);
  } catch (err) {
    next(err);
  }
};

export const createPayrollBatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const batch = await service.createPayrollBatch(req.body);

    sendSuccess(res, batch, 201, "Payroll batch created");
  } catch (err) {
    next(err);
  }
};

export const decidePayrollBatch = async (
  req: Request<PayrollBatchParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const batch = await service.decidePayrollBatch(
      req.params.id,
      req.body,
    );

    sendSuccess(
      res,
      batch,
      200,
      "Payroll batch decision recorded",
    );
  } catch (err) {
    next(err);
  }
};