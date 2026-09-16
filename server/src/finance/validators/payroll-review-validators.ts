import { z } from "zod";

export const createPayrollBatchSchema = z.object({
  id: z.string().min(2).max(32),
  projectCode: z.string().max(50).optional(),
  period: z.string().min(1).max(32),
  group: z.string().min(1).max(128),
  employees: z.number().int().nonnegative(),
  overtimeHours: z.number().nonnegative().optional(),
  grossPayroll: z.number().nonnegative(),
  deductions: z.number().nonnegative().optional(),
  netPayroll: z.number().nonnegative(),
  status: z.enum(["pending", "approved", "rejected", "processing"]).optional(),
});

export const decidePayrollBatchSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reviewedBy: z.string().min(2).max(255),
  comment: z.string().max(2000).optional(),
});
