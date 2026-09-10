import { Router } from "express";
import * as controller from "./controller.js";

const router = Router();

router.get("/summary", controller.getSummary);

export default router;
