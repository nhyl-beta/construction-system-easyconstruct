import { desc, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { payrollBatches } from "../db/schema/finance.js";

export const findAll = async () => {
  return await db.select().from(payrollBatches).orderBy(desc(payrollBatches.createdAt));
};

export const findById = async (id: string) => {
  const [row] = await db.select().from(payrollBatches).where(eq(payrollBatches.id, id));
  return row ?? null;
};

export const create = async (data: typeof payrollBatches.$inferInsert) => {
  const [created] = await db.insert(payrollBatches).values(data).returning();
  return created;
};
