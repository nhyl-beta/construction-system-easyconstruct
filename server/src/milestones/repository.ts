// server/src/milestones/repository.ts — NEW
import { desc, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { milestones } from "../db/schema/milestones.js";
import type { CreateMilestoneInput, UpdateMilestoneInput } from "./types.js";

export const findAll = async (projectCode?: string) => {
  const query = db.select().from(milestones).orderBy(desc(milestones.createdAt));
  return projectCode ? query.where(eq(milestones.projectCode, projectCode)) : query;
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(milestones).where(eq(milestones.id, id));
  return row ?? null;
};

export const create = async (
  data: CreateMilestoneInput & { createdBy: string; status: string },
) => {
  const [created] = await db.insert(milestones).values(data).returning();
  return created ?? null;
};

export const update = async (id: number, data: UpdateMilestoneInput) => {
  const [updated] = await db
    .update(milestones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(milestones.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(milestones).where(eq(milestones.id, id)).returning();
  return deleted ?? null;
};
