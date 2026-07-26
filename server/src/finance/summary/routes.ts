import { Router } from "express";
import { summaryController } from "./controller.js";

export const summaryRouter = Router();
summaryRouter.get("/", summaryController.get);
