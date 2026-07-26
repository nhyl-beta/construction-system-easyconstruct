import { NextFunction, Request, Response } from "express";
import { HTTP } from "../../constants/http-status.js";
import { MSG } from "../../constants/messages.js";
import { formatSuccess } from "../../utils/response.js";
import * as service from "./service.js";
import type { BudgetFilters, BudgetStatus } from "./types.js";

const validStatuses: readonly BudgetStatus[] = [
  "draft",
  "pending-review",
  "finance-review",
  "manager-review",
  "approved",
  "rejected",
  "locked",
];

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = req.query.status;

    const filters: BudgetFilters = {
      fiscalYear:
        typeof req.query.fiscalYear === "string"
          ? req.query.fiscalYear
          : undefined,

      search:
        typeof req.query.search === "string" ? req.query.search : undefined,

      status:
        status === "all"
          ? "all"
          : typeof status === "string" &&
              validStatuses.includes(status as BudgetStatus)
            ? (status as BudgetStatus)
            : undefined,
    };

    const data = await service.getAll(filters);

    res.json(formatSuccess(data, MSG.budgets.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getById(Number(req.params.id));

    res.json(formatSuccess(data, MSG.budgets.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.create(req.body);

    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.budgets.created));
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);

    res.json(formatSuccess(data, MSG.budgets.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.remove(Number(req.params.id));

    res.json(formatSuccess(data, MSG.budgets.deleted));
  } catch (err) {
    next(err);
  }
};
