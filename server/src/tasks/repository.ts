// server/src/tasks/repository.ts — NEW
import { and, desc, eq, inArray, sql, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { tasks } from "../db/schema/task.js";
import { countRows, inCodes, selectPage } from "../db/paged.js";
import type { CreateTaskInput, TaskFilters, UpdateTaskInput } from "./types.js";

const buildConditions = (filters: TaskFilters): SQL[] => {
  const conditions: SQL[] = [];
  if (filters.codes) conditions.push(inCodes(tasks.projectCode, filters.codes));
  if (filters.projectCode) conditions.push(eq(tasks.projectCode, filters.projectCode));
  if (filters.status && filters.status !== "all") conditions.push(eq(tasks.status, filters.status));
  if (filters.assignedToUserId) conditions.push(eq(tasks.assignedToUserId, filters.assignedToUserId));
  return conditions;
};

/** Per-project rollup of task statuses and progress (the engineer's progress card). */
export const progressByProject = async (filters: TaskFilters = {}) => {
  const conditions = buildConditions({ ...filters, status: undefined });
  const rows = await db
    .select({
      projectCode: tasks.projectCode,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'Completed')::int`,
      inProgress: sql<number>`count(*) filter (where ${tasks.status} = 'In Progress')::int`,
      pending: sql<number>`count(*) filter (where ${tasks.status} = 'Pending')::int`,
      progressSum: sql<number>`coalesce(sum(${tasks.progress}), 0)::int`,
    })
    .from(tasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(tasks.projectCode)
    .orderBy(tasks.projectCode);
  return rows.map((r) => ({
    projectCode: r.projectCode,
    total: r.total,
    completed: r.completed,
    inProgress: r.inProgress,
    pending: r.pending,
    percentComplete: r.total ? Math.round(r.progressSum / r.total) : 0,
  }));
};

export const TASK_SORT_COLUMNS = {
  id: tasks.id,
  title: tasks.title,
  status: tasks.status,
  priority: tasks.priority,
  dueDate: tasks.dueDate,
  projectCode: tasks.projectCode,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
} as const;

export const defaultTaskOrder = [desc(tasks.id)];

export const countFiltered = async (filters: TaskFilters = {}) => {
  const conditions = buildConditions(filters);
  return countRows(tasks, conditions.length ? and(...conditions) : undefined);
};

export const findPage = async (filters: TaskFilters, window: { limit: number; offset: number }, orderBy: SQL[]) => {
  const conditions = buildConditions(filters);
  return selectPage(tasks, conditions.length ? and(...conditions) : undefined, orderBy, window);
};

export const findAll = async (filters: TaskFilters = {}) => {
  const conditions = buildConditions(filters);

  // Newest first, and applied here (not client-side) so it survives refetch.
  return conditions.length
    ? await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.id))
    : await db.select().from(tasks).orderBy(desc(tasks.id));
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
  return row ?? null;
};

/** Several tasks in one query, keyed by id. */
export const findByIds = async (ids: number[]) => {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<number, typeof tasks.$inferSelect>();
  const rows = await db.select().from(tasks).where(inArray(tasks.id, unique));
  return new Map(rows.map((r) => [r.id, r]));
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