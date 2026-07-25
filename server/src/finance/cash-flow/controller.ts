import type { Request, Response, NextFunction } from "express";
import { cashFlowRepository } from "../cash-flow/repository.js";
import { sendSuccess } from "../../utils/response.js";

export const cashFlowController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const data = await cashFlowRepository.findRecent(months);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};