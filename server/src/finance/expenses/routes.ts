import { Router } from "express";
import { expensesController } from "../expenses/controller.js";

export const expensesRouter = Router();

expensesRouter.get("/", expensesController.list);
expensesRouter.post("/", expensesController.create);
expensesRouter.patch("/:id/approve", expensesController.approve);
expensesRouter.patch("/:id/reject", expensesController.reject);