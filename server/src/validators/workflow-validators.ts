import { z } from "zod";

// A file or a written submission filed against a workflow. `kind` is
// optional: the service infers "document" when a fileUrl is present and
// "note" otherwise, so callers that only have text don't have to say so.
export const workflowAttachmentSchema = z.object({
  kind: z.enum(["document", "note"]).optional(),
  label: z.string().min(1).max(255),
  content: z.string().max(10_000).optional(),
  fileUrl: z.string().max(500).optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.string().max(20).optional(),
  stageId: z.number().int().optional(),
});

// One materials / labour / other-cost change behind a budget-change request.
export const workflowLineItemSchema = z.object({
  category: z.enum(["materials", "labor", "equipment", "subcontractor", "other"]),
  description: z.string().min(1).max(255),
  currentAmount: z.number().optional(),
  requestedAmount: z.number(),
  // ai-signals: optional inputs for the decision-support cost comparison —
  // without both, the line is simply never compared (a "no-match" reason,
  // not a validation error).
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(20).optional(),
});

export const createWorkflowSchema = z.object({
  title: z.string().min(2).max(255),
  projectCode: z.string().min(1).max(50),
  templateId: z.number().int(),
  amount: z.number().nonnegative().optional(),
  type: z.string().max(50).optional(),
  stageAssignments: z.record(z.string(), z.string().max(100)).optional(),
  attachments: z.array(workflowAttachmentSchema).max(20).optional(),
  lineItems: z.array(workflowLineItemSchema).max(100).optional(),
  budgetId: z.number().int().positive().optional(),
});

export const addAttachmentSchema = workflowAttachmentSchema;

// One step of a custom workflow template: which role decides at this point,
// the label shown for it, and the icon key the stage-pipeline UI already
// knows how to render (see client/src/components/workflows/
// workflow-stage-pipeline.tsx's WORKFLOW_STAGE_ICONS — an unknown key just
// falls back to a default icon there, so this is left open rather than
// re-declaring that map on the server).
export const workflowStageDefinitionSchema = z.object({
  role: z.string().min(1).max(40),
  roleLabel: z.string().min(1).max(60),
  iconKey: z.string().min(1).max(30).default("UserCheck"),
});

// Admin/IT Designer defining a reusable workflow template — the steps/roles/
// order a new workflow can later be started from (see workflows/service.ts
// createTemplate). At least 2 stages: a 1-stage "workflow" is really just an
// approval by its own initiator and doesn't need a template of its own.
export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(1).max(500),
  avgDurationHours: z.number().positive().max(10_000),
  defaultStages: z.array(workflowStageDefinitionSchema).min(2).max(10),
});

export const decideStageSchema = z.object({
  decision: z.enum(["approve", "reject", "revise"]),
  comments: z.string().max(1000).optional(),
});

// Title/projectCode/severity/type only — stage reassignment goes through
// stageAssignments on create, and decisions go through decideStageSchema.
export const updateWorkflowSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  projectCode: z.string().min(1).max(50).optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
  type: z.string().max(50).optional(),
});