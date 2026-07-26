// repository.ts
import { db } from "../../db/connection.js";
import { designReviews } from "../../db/schema/design-reviews.js";
import { eq, and, SQL } from 'drizzle-orm';
import type { CreateDesignReviewInput, DesignReviewFilters } from "./types.js";

export const findAll = async (filters: DesignReviewFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.designId) conditions.push(eq(designReviews.designId, filters.designId));
  if (filters.status && filters.status !== 'all') conditions.push(eq(designReviews.status, filters.status));

  return conditions.length
    ? await db.select().from(designReviews).where(and(...conditions))
    : await db.select().from(designReviews);
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(designReviews).where(eq(designReviews.id, id));
  return row ?? null;
};

export const create = async (data: CreateDesignReviewInput) => {
  const [created] = await db.insert(designReviews).values(data).returning();
  return created;
};

export const decide = async (id: number, status: string) => {
  const [updated] = await db
    .update(designReviews)
    .set({ status, completedAt: new Date() })
    .where(eq(designReviews.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(designReviews).where(eq(designReviews.id, id)).returning();
  return deleted ?? null;
};