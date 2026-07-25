import type { Request, Response, NextFunction } from "express";
import { projectProfitabilityRepository } from "../project-profitability/repository.js";
import { sendSuccess } from "../../utils/response.js";

export const projectProfitabilityController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectProfitabilityRepository.compute();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};