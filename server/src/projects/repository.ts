import { db }       from "../db/connection.js";
import { projects } from "../db/schema/projects.js";
import { eq, ilike, and, or, SQL } from 'drizzle-orm';
import type { CreateProjectInput, UpdateProjectInput, ProjectFilters } from "./types.js";

export const findAll = async (filters: ProjectFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.status && filters.status !== 'all')
    conditions.push(eq(projects.status, filters.status));

  if (filters.risk && filters.risk !== 'all')
    conditions.push(eq(projects.risk, filters.risk));

  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(projects.name, s),
        ilike(projects.code, s),
        ilike(projects.pm,   s),
      )!,
    );
  }

  return conditions.length
    ? await db.select().from(projects).where(and(...conditions))
    : await db.select().from(projects);
};

export const findById = async (id: number) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id));
  return project ?? null;
};

export const create = async (data: CreateProjectInput) => {
  const [created] = await db.insert(projects).values(data).returning();
  return created;
};

export const update = async (id: number, data: UpdateProjectInput) => {
  const [updated] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning();
  return deleted ?? null;
};