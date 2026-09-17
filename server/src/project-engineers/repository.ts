import { db } from "../db/connection.js";
import { projectEngineers } from "../db/schema/project-engineers.js";
import { eq } from "drizzle-orm";
import type { CreateProjectEngineerInput, ProjectEngineerFilters } from "./types.js";

export const findAll = async (filters: ProjectEngineerFilters = {}) => {
  return filters.projectCode
    ? await db.select().from(projectEngineers).where(eq(projectEngineers.projectCode, filters.projectCode))
    : await db.select().from(projectEngineers);
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(projectEngineers).where(eq(projectEngineers.id, id));
  return row ?? null;
};

export const create = async (data: CreateProjectEngineerInput) => {
  const [created] = await db.insert(projectEngineers).values(data).returning();
  return created ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(projectEngineers).where(eq(projectEngineers.id, id)).returning();
  return deleted ?? null;
};
