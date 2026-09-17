import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/summary", controller.getSummary);

export default router;
