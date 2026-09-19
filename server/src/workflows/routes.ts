import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  createWorkflowSchema,
  decideStageSchema,
  updateWorkflowSchema,
} from "../validators/workflow-validators.js";

const router = Router();

router.use(authenticate);

router.get("/templates", controller.getTemplates);
router.get("/approvals", controller.getApprovals);
router.get("/approvals/stats", controller.getApprovalStats);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.post(
  "/",
  requireRole("project-manager", "admin", "it-designer"),
  validate(createWorkflowSchema),
  controller.create,
);

// Route-level gate is "who may ever call this" (PM/admin/it-designer);
// "who may call it on THIS workflow" (creator, or admin bypass) is
// enforced in service.assertCanManageWorkflow.
router.patch(
  "/:id",
  requireRole("project-manager", "admin", "it-designer"),
  validate(updateWorkflowSchema),
  controller.update,
);

router.delete(
  "/:id",
  requireRole("project-manager", "admin", "it-designer"),
  controller.remove,
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
    "it-designer",
  ),
  validate(decideStageSchema),
  controller.decideStage,
);

export default router;