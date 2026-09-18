import { db } from "../db/connection.js";
import { projectMembers } from "../db/schema/project-members.js";
import { and, eq, SQL } from "drizzle-orm";
import type { CreateProjectMemberInput, ProjectMemberFilters } from "./types.js";

export const findAll = async (filters: ProjectMemberFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.projectCode) conditions.push(eq(projectMembers.projectCode, filters.projectCode));
  if (filters.userId) conditions.push(eq(projectMembers.userId, filters.userId));
  if (filters.role) conditions.push(eq(projectMembers.role, filters.role));

  return conditions.length
    ? await db.select().from(projectMembers).where(and(...conditions))
    : await db.select().from(projectMembers);
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(projectMembers).where(eq(projectMembers.id, id));
  return row ?? null;
};

export const create = async (data: CreateProjectMemberInput) => {
  const [created] = await db.insert(projectMembers).values(data).returning();
  return created ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(projectMembers).where(eq(projectMembers.id, id)).returning();
  return deleted ?? null;
};
