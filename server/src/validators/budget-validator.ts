import { z } from "zod";

export const budgetStatusSchema = z.enum([
  "draft",
  "pending-review",
  "finance-review",
  "manager-review",
  "approved",
  "rejected",
  "locked",
]);

export const createBudgetSchema = z.object({
  project: z
    .string()
    .min(2, "Project name is required")
    .max(255),

  category: z
    .string()
    .min(2, "Category is required")
    .max(64),

  owner: z
    .string()
    .min(2, "Owner is required")
    .max(255),

  planned: z
    .number()
    .nonnegative("Planned budget cannot be negative"),

  committed: z
    .number()
    .nonnegative()
    .optional()
    .default(0),

  spent: z
    .number()
    .nonnegative()
    .optional()
    .default(0),

  fiscalYear: z
    .string()
    .regex(
      /^\d{4}$/,
      "Fiscal year must be in YYYY format",
    ),

  status: budgetStatusSchema
    .optional()
    .default("draft"),
});

export const updateBudgetSchema =
  createBudgetSchema.partial();

export type CreateBudgetInput =
  z.infer<typeof createBudgetSchema>;

export type UpdateBudgetInput =
  z.infer<typeof updateBudgetSchema>;