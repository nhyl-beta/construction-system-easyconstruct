import { db } from "../../db/connection.js";
import { designRevisions } from "../../db/schema/design-revisions.js";
import { eq, and, SQL } from 'drizzle-orm';
import type { CreateDesignRevisionInput, UpdateDesignRevisionInput, DesignRevisionFilters } from "./types.js";

export const findAll = async (filters: DesignRevisionFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.designId) conditions.push(eq(designRevisions.designId, filters.designId));
  if (filters.status && filters.status !== 'all') conditions.push(eq(designRevisions.status, filters.status));

  return conditions.length
    ? await db.select().from(designRevisions).where(and(...conditions))
    : await db.select().from(designRevisions);
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(designRevisions).where(eq(designRevisions.id, id));
  return row ?? null;
};

export const create = async (data: CreateDesignRevisionInput) => {
  const [created] = await db.insert(designRevisions).values(data).returning();
  return created;
};

export const update = async (id: number, data: UpdateDesignRevisionInput) => {
  const [updated] = await db.update(designRevisions).set(data).where(eq(designRevisions.id, id)).returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(designRevisions).where(eq(designRevisions.id, id)).returning();
  return deleted ?? null;
};