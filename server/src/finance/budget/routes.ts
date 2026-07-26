import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import {
  createBudgetSchema,
  updateBudgetSchema,
} from "../../validators/budget-validator.js";
import * as controller from "./controller.js";

export const budgetsRoutes = Router();

budgetsRoutes.get("/", controller.getAll);

budgetsRoutes.post("/", validate(createBudgetSchema), controller.create);

budgetsRoutes.get("/:id", controller.getById);

budgetsRoutes.patch("/:id", validate(updateBudgetSchema), controller.update);

budgetsRoutes.delete("/:id", controller.remove);

export default budgetsRoutes;
