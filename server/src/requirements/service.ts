import { db } from "../db/connection.js";
import { requirements } from "../db/schema/requirements.js";
import { projects } from "../db/schema/projects.js";
import { and, desc, eq, ilike, SQL } from "drizzle-orm";
import { ValidationError } from "../utils/errors.js";
import type {
  CreateRequirementInput,
  UpdateRequirementInput,
  RequirementFilters,
} from "./types.js";

export const findAll = async (filters: RequirementFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.project && filters.project !== "all") {
    conditions.push(eq(requirements.project, filters.project));
  }
  if (filters.category && filters.category !== "all") {
    conditions.push(eq(requirements.category, filters.category));
  }
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(requirements.status, filters.status));
  }
  if (filters.search) {
    conditions.push(ilike(requirements.title, `%${filters.search}%`));
  }

  const query = db.select().from(requirements).orderBy(desc(requirements.updatedAt));
  return conditions.length ? await query.where(and(...conditions)) : await query;
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(requirements).where(eq(requirements.id, id));
  return row ?? null;
};

export const create = async (data: CreateRequirementInput) => {
  const [project] = await db.select().from(projects).where(eq(projects.code, data.project));
  if (!project) {
    throw new ValidationError(`No project found with code "${data.project}"`);
  }
  const requirementId =
    data.requirementId ??
    `REQ-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const [created] = await db
    .insert(requirements)
    .values({ ...data, requirementId })
    .returning();
  if (!created) throw new Error("Failed to create requirement");
  return created;
};

export const update = async (id: number, data: UpdateRequirementInput) => {
  const [updated] = await db
    .update(requirements)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(requirements.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(requirements).where(eq(requirements.id, id)).returning();
  return deleted ?? null;
};