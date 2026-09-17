import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { createIssueSchema, updateIssueStatusSchema } from "../validators/issue-validators.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post(
  "/",
  requireRole("site-personnel", "engineer"),
  validate(createIssueSchema),
  controller.create,
);
router.patch(
  "/:id/status",
  requireRole("project-manager", "engineer"),
  validate(updateIssueStatusSchema),
  controller.updateStatus,
);

export default router;