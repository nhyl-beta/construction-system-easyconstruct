import { z } from "zod";
import { REQUIREMENT_CATEGORIES, REQUIREMENT_STATUSES } from "../requirements/types.js";

export const createRequirementSchema = z.object({
  requirementId: z.string().min(2).max(20).optional(),
  title: z.string().min(4, "Title is required"),
  project: z.string().min(2, "Select a project"),
  category: z.enum(REQUIREMENT_CATEGORIES),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(REQUIREMENT_STATUSES).optional(),
  createdBy: z.string().min(2),
});

export const updateRequirementSchema = createRequirementSchema.partial();

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;