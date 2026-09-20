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
});

export const addAttachmentSchema = workflowAttachmentSchema;

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