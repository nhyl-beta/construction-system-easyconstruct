import { and, eq, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { payroll } from "../db/schema/payroll.js";
import type { PayrollFilters } from "./types.js";

export const findAll = async (filters: PayrollFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.period) conditions.push(eq(payroll.period, filters.period));
  if (filters.empId) conditions.push(eq(payroll.empId, filters.empId));
  if (filters.status && filters.status !== "all")
    conditions.push(eq(payroll.status, filters.status));

  return conditions.length
    ? await db.select().from(payroll).where(and(...conditions))
    : await db.select().from(payroll);
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(payroll).where(eq(payroll.id, id));
  return row ?? null;
};

export const create = async (data: typeof payroll.$inferInsert) => {
  const [created] = await db.insert(payroll).values(data).returning();
  return created;
};

export const update = async (id: number, data: Partial<typeof payroll.$inferInsert>) => {
  const [updated] = await db
    .update(payroll)
    .set(data)
    .where(eq(payroll.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(payroll).where(eq(payroll.id, id)).returning();
  return deleted ?? null;
};
