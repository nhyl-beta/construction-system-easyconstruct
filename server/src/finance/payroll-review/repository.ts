import { and, eq } from "drizzle-orm";

import { db } from "../../db/connection.js";
import { payrollBatches } from "../../db/schema/finance.js";

import type { CreatePayrollBatchInput, PayrollBatchFilters } from "./types.js";

const toDto = (row: typeof payrollBatches.$inferSelect) => ({
  id: row.id,
  projectCode: row.projectCode,
  period: row.period,
  group: row.group,
  employees: row.employees,
  overtimeHours: row.overtimeHours,
  grossPayroll: row.grossPayroll,
  deductions: row.deductions,
  netPayroll: row.netPayroll,
  status: row.status,
  reviewedBy: row.reviewedBy,
  reviewedAt: row.reviewedAt,
  createdAt: row.createdAt,
});

export const findAll = async (filters: PayrollBatchFilters = {}) => {
  const conditions = [];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(payrollBatches.status, filters.status));
  }

  if (filters.projectCode) {
    conditions.push(eq(payrollBatches.projectCode, filters.projectCode));
  }

  const rows = conditions.length
    ? await db
        .select()
        .from(payrollBatches)
        .where(and(...conditions))
    : await db.select().from(payrollBatches);

  return rows.map(toDto);
};

export const findById = async (id: string) => {
  const [row] = await db
    .select()
    .from(payrollBatches)
    .where(eq(payrollBatches.id, id));

  return row ? toDto(row) : null;
};

export const create = async (data: CreatePayrollBatchInput) => {
  const created = await db
    .insert(payrollBatches)
    .values(data)
    .returning()
    .then((rows) => rows[0]);

  if (!created) {
    throw new Error("Failed to create payroll batch.");
  }

  return toDto(created);
};

export const decide = async (
  id: string,
  decision: "approved" | "rejected",
  reviewedBy: string,
) => {
  const [updated] = await db
    .update(payrollBatches)
    .set({
      status: decision,
      reviewedBy,
      reviewedAt: new Date(),
    })
    .where(eq(payrollBatches.id, id))
    .returning();

  return updated ? toDto(updated) : null;
};
