import { Router } from "express";
import { cashFlowController } from "./controller.js";

export const cashFlowRouter = Router();
cashFlowRouter.get("/", cashFlowController.list);
