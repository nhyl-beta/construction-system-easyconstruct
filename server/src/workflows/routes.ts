import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { advisoryDocumentUpload } from "../documents/upload.js";
import {
  addAttachmentSchema,
  createWorkflowSchema,
  decideStageSchema,
  updateWorkflowSchema,
} from "../validators/workflow-validators.js";

const router = Router();

router.use(authenticate);

// Every role that owns a stage in a seeded template can also start one:
// Architect raises a design-proposal approval or a public-works compliance
// review, Engineer raises a budget-change request, HR raises subcontractor
// planning. Restricting creation to PM/admin was what left those roles with
// a stage to decide but no way to initiate the chain that reaches it.
const canInitiateWorkflow = requireRole(
  "project-manager",
  "admin",
  "it-designer",
  "architect",
  "engineer",
  "human-resources",
  "finance-manager",
  "consultant",
);

router.get("/templates", controller.getTemplates);
router.get("/approvals", controller.getApprovals);
router.get("/approvals/stats", controller.getApprovalStats);
// Before "/:id", or Express matches this path as a workflow id.
router.get(
  "/budget-change-requests",
  requireRole("finance-manager", "project-manager", "admin", "it-designer", "engineer"),
  controller.getBudgetChangeRequests,
);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.post("/", canInitiateWorkflow, validate(createWorkflowSchema), controller.create);

// Filing a submission against a running workflow. Same role set as creation:
// whoever can start a chain can also add to the one they are standing in.
router.post(
  "/:id/attachments",
  canInitiateWorkflow,
  validate(addAttachmentSchema),
  controller.addAttachment,
);

// Multipart variant. `validate` is deliberately absent — the body arrives as
// multipart form fields, which the JSON schema above cannot parse; the
// controller normalizes and bounds the fields itself.
router.post(
  "/:id/attachments/upload",
  canInitiateWorkflow,
  advisoryDocumentUpload.single("file"),
  controller.uploadAttachment,
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
