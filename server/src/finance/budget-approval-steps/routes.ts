import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { decideBudgetApprovalSchema } from "../../validators/budget-approval-validators.js";
import * as controller from "./controller.js";

export const budgetApprovalStepsRoutes = Router();

budgetApprovalStepsRoutes.get("/", controller.getAll);
budgetApprovalStepsRoutes.post(
  "/decide",
  validate(decideBudgetApprovalSchema),
  controller.decide,
);
