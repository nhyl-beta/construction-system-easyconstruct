import { Router } from "express";
import { cashFlowController } from "../cash-flow/controller.js";

export const cashFlowRouter = Router();
cashFlowRouter.get("/", cashFlowController.list);