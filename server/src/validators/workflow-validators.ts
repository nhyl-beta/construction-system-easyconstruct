import { z } from "zod";

export const createWorkflowSchema = z.object({
  title: z.string().min(2).max(255),
  projectCode: z.string().min(1).max(50),
  templateId: z.number().int(),
  amount: z.number().nonnegative().optional(),
  type: z.string().max(50).optional(),
  stageAssignments: z.record(z.string(), z.string().max(100)).optional(),
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