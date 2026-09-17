import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate, requireRole("admin", "super-admin"));

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

export default router;
