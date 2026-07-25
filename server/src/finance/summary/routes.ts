import { Router } from "express";
import { summaryController } from "../summary/controller.js";

export const summaryRouter = Router();
summaryRouter.get("/", summaryController.get);