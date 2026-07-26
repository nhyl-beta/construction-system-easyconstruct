import { and, eq, ilike, or, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { designs } from "../db/schema/designs.js";
import type {
  CreateDesignInput,
  DesignFilters,
  UpdateDesignInput,
} from "./types.js";

export const findAll = async (filters: DesignFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.status && filters.status !== "all")
    conditions.push(eq(designs.status, filters.status));

  if (filters.discipline && filters.discipline !== "all")
    conditions.push(eq(designs.discipline, filters.discipline));

  if (filters.projectCode && filters.projectCode !== "all")
    conditions.push(eq(designs.projectCode, filters.projectCode));

  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(designs.name, s),
        ilike(designs.code, s),
        ilike(designs.leadArchitect, s),
      )!,
    );
  }

  return conditions.length
    ? await db
        .select()
        .from(designs)
        .where(and(...conditions))
    : await db.select().from(designs);
};

export const findById = async (id: number) => {
  const [design] = await db.select().from(designs).where(eq(designs.id, id));
  return design ?? null;
};

export const create = async (data: CreateDesignInput) => {
  const [created] = await db.insert(designs).values(data).returning();
  return created;
};

export const update = async (id: number, data: UpdateDesignInput) => {
  const [updated] = await db
    .update(designs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(designs.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db
    .delete(designs)
    .where(eq(designs.id, id))
    .returning();
  return deleted ?? null;
};
