import { NextFunction, Request, Response } from "express";
import { HTTP } from "../../../constants/http-status.js";
import { MSG } from "../../../constants/messages.js";
import { formatSuccess } from "../../../utils/response.js";
import * as service from "./service.js";
import type { BudgetAdjustmentFilters } from "./types.js";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters: BudgetAdjustmentFilters = {
      budgetId: req.query.budgetId ? Number(req.query.budgetId) : undefined,
      kind: req.query.kind as string,
      status: req.query.status as string,
      search: req.query.search as string,
    };
    res.json(
      formatSuccess(
        await service.getAll(filters),
        MSG.budgetAdjustments.retrieved,
      ),
    );
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
    res.json(
      formatSuccess(
        await service.getById(Number(req.params.id)),
        MSG.budgetAdjustments.single,
      ),
    );
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
    res
      .status(HTTP.CREATED)
      .json(
        formatSuccess(
          await service.create(req.body),
          MSG.budgetAdjustments.created,
        ),
      );
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
    res.json(
      formatSuccess(
        await service.update(Number(req.params.id), req.body),
        MSG.budgetAdjustments.updated,
      ),
    );
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
    res.json(
      formatSuccess(
        await service.remove(Number(req.params.id)),
        MSG.budgetAdjustments.deleted,
      ),
    );
  } catch (err) {
    next(err);
  }
};
