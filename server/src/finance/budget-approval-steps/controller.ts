import { NextFunction, Request, Response } from "express";
import { HTTP } from "../../constants/http-status.js";
import { MSG } from "../../constants/messages.js";
import { formatSuccess } from "../../utils/response.js";
import * as service from "./service.js";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const budgetId = req.query.budgetId
      ? Number(req.query.budgetId)
      : undefined;
    const data = await service.getAll({ budgetId });
    res.json(formatSuccess(data, MSG.budgetApprovalSteps.retrieved));
  } catch (err) {
    next(err);
  }
};

export const decide = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.decide(req.body);
    res
      .status(HTTP.CREATED)
      .json(formatSuccess(data, MSG.budgetApprovalSteps.created));
  } catch (err) {
    next(err);
  }
};
