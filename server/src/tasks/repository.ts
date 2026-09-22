// server/src/tasks/repository.ts — NEW
import { and, desc, eq, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { tasks } from "../db/schema/task.js";
import type { CreateTaskInput, TaskFilters, UpdateTaskInput } from "./types.js";

export const findAll = async (filters: TaskFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.projectCode) conditions.push(eq(tasks.projectCode, filters.projectCode));
  if (filters.status && filters.status !== "all") conditions.push(eq(tasks.status, filters.status));
  if (filters.assignedToUserId) conditions.push(eq(tasks.assignedToUserId, filters.assignedToUserId));

  // Newest first, and applied here (not client-side) so it survives refetch.
  return conditions.length
    ? await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.id))
    : await db.select().from(tasks).orderBy(desc(tasks.id));
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
  return row ?? null;
};

export const create = async (data: CreateTaskInput) => {
  const [created] = await db.insert(tasks).values(data).returning();
  return created;
};

export const update = async (id: number, data: UpdateTaskInput) => {
  const [updated] = await db
    .update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  return deleted ?? null;
};