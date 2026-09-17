import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { createWorkflowSchema, decideStageSchema } from "../validators/workflow-validators.js";

const router = Router();

router.use(authenticate);

router.get("/templates", controller.getTemplates);
router.get("/approvals", controller.getApprovals);
router.get("/approvals/stats", controller.getApprovalStats);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.post(
  "/",
  requireRole("project-manager", "admin", "super-admin"),
  validate(createWorkflowSchema),
  controller.create,
);

router.patch(
  "/:id/stages/:stageId/decision",
  requireRole(
    "project-manager",
    "finance-manager",
    "human-resources",
    "architect",
    "engineer",
    "consultant",
    "admin",
    "super-admin",
  ),
  validate(decideStageSchema),
  controller.decideStage,
);

export default router;