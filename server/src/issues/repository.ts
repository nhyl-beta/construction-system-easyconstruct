// server/src/issues/repository.ts — NEW
import { and, eq, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { issues } from "../db/schema/issues.js";
import type { CreateIssueInput, IssueFilters } from "./types.js";

export const findAll = async (filters: IssueFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.projectCode) conditions.push(eq(issues.projectCode, filters.projectCode));
  if (filters.status && filters.status !== "all") conditions.push(eq(issues.status, filters.status));
  if (filters.reportedByUserId) conditions.push(eq(issues.reportedByUserId, filters.reportedByUserId));

  return conditions.length
    ? await db.select().from(issues).where(and(...conditions))
    : await db.select().from(issues);
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(issues).where(eq(issues.id, id));
  return row ?? null;
};

export const create = async (data: CreateIssueInput) => {
  const [created] = await db.insert(issues).values(data).returning();
  return created;
};

export const updateStatus = async (id: number, status: string, resolutionNotes?: string) => {
  const [updated] = await db
    .update(issues)
    .set({ status, resolutionNotes, updatedAt: new Date() })
    .where(eq(issues.id, id))
    .returning();
  return updated ?? null;
};