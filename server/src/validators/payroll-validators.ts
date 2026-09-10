import { z } from "zod";

export const payrollEntrySchema = z.object({
  employeeId: z.string().min(1),
  hoursWorked: z.number().min(0),
  overtimeHours: z.number().min(0).optional(),
  adjustments: z.number().optional(),
});

export const generatePayrollSchema = z.object({
  period: z.string().min(1, "Payroll period is required"),
  group: z.string().optional(),
  projectCode: z.string().optional(),
  entries: z.array(payrollEntrySchema).min(1, "At least one employee entry is required"),
});

export const updatePayrollLineSchema = z.object({
  hours: z.number().min(0).optional(),
  overtime: z.number().min(0).optional(),
  gross: z.number().optional(),
  deductions: z.number().optional(),
  net: z.number().optional(),
  status: z.enum(["Pending", "Processing", "Completed"]).optional(),
});
