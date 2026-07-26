import { Router } from "express";
import { validate } from "../../../middleware/validate.js";
import {
  createBudgetAdjustmentSchema,
  updateBudgetAdjustmentSchema,
} from "../../../validators/budget-adjustment-validators.js";
import * as controller from "./controller.js";

export const budgetAdjustmentsRoutes = Router();

budgetAdjustmentsRoutes.get("/", controller.getAll);
budgetAdjustmentsRoutes.post(
  "/",
  validate(createBudgetAdjustmentSchema),
  controller.create,
);
budgetAdjustmentsRoutes.get("/:id", controller.getById);
budgetAdjustmentsRoutes.patch(
  "/:id",
  validate(updateBudgetAdjustmentSchema),
  controller.update,
);
budgetAdjustmentsRoutes.delete("/:id", controller.remove);
