import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { createProjectEngineerSchema } from "../validators/project-engineer-validators.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.getAll);
router.post(
  "/",
  requireRole("project-manager", "admin", "super-admin"),
  validate(createProjectEngineerSchema),
  controller.create,
);
router.delete(
  "/:id",
  requireRole("project-manager", "admin", "super-admin"),
  controller.remove,
);

export default router;
