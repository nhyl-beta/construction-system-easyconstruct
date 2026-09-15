// server/src/tasks/routes.ts — NEW
import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from "../validators/task-validators.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", requireRole("project_manager", "engineer"), validate(createTaskSchema), controller.create);
router.patch("/:id/status", requireRole("site_personnel"), validate(updateTaskStatusSchema), controller.updateStatus);
router.patch("/:id", requireRole("project_manager", "engineer"), validate(updateTaskSchema), controller.update);
router.delete("/:id", requireRole("project_manager"), controller.remove);

export default router;