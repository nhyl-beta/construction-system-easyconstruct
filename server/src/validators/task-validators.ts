// server/src/validators/task-validators.ts — NEW
import { z } from "zod";

export const createTaskSchema = z.object({
  taskCode: z.string().min(2).max(20),
  projectCode: z.string().min(1).max(50),
  title: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  status: z.enum(["Pending", "In Progress", "Completed"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().optional(),
  assignedToUserId: z.number().int().optional(),
  assignedToName: z.string().max(100).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: z.enum(["Pending", "In Progress", "Completed"]),
});