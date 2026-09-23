import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";
import {
  createBudgetSchema,
  updateBudgetSchema,
} from "../../validators/budget-validator.js";
import * as controller from "./controller.js";

export const budgetsRoutes = Router();

// Reads: any authenticated role (authenticate is mounted on /api/finance in
// app.ts). Writes: finance-manager + admin only — finance-budget.tsx is the
// only screen that creates/edits/deletes budget lines.
budgetsRoutes.get("/", controller.getAll);
budgetsRoutes.get("/:id", controller.getById);

budgetsRoutes.post(
  "/",
  requireRole("finance-manager", "admin"),
  validate(createBudgetSchema),
  controller.create,
);
budgetsRoutes.patch(
  "/:id",
  requireRole("finance-manager", "admin"),
  validate(updateBudgetSchema),
  controller.update,
);
budgetsRoutes.delete(
  "/:id",
  requireRole("finance-manager", "admin"),
  controller.remove,
);

export default budgetsRoutes;
