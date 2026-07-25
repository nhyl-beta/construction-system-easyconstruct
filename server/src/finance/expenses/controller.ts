import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { expensesService } from "../expenses/services.js";

export const expensesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, category, page, pageSize } = req.query;

      const data = await expensesService.list({
        query: query as string | undefined,
        category: category as string | undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });

      return sendSuccess(res, data, 200, "Expenses retrieved successfully");
    } catch (err) {
      return next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await expensesService.create(req.body);

      return sendSuccess(res, data, 201, "Expense created successfully");
    } catch (err) {
      return next(err);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await expensesService.approve(req.params.id as string);

      return sendSuccess(res, data, 200, "Expense approved successfully");
    } catch (err) {
      return next(err);
    }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await expensesService.reject(req.params.id as string);

      return sendSuccess(res, data, 200, "Expense rejected successfully");
    } catch (err) {
      return next(err);
    }
  },
};
