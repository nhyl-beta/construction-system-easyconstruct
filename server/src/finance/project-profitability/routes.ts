import { Router } from "express";
import { projectProfitabilityController } from "./controller.js";

export const projectProfitabilityRouter = Router();
projectProfitabilityRouter.get("/", projectProfitabilityController.list);
