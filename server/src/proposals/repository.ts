import { and, eq, ilike, or, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { proposals } from "../db/schema/proposals.js";
import type {
  CreateProposalInput,
  ProposalFilters,
  UpdateProposalInput,
} from "./types.js";

export const findAll = async (filters: ProposalFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.status && filters.status !== "all")
    conditions.push(eq(proposals.status, filters.status));

  if (filters.projectCode && filters.projectCode !== "all")
    conditions.push(eq(proposals.projectCode, filters.projectCode));

  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(proposals.title, s),
        ilike(proposals.proposalId, s),
        ilike(proposals.submittedBy, s),
      )!,
    );
  }

  return conditions.length
    ? await db
        .select()
        .from(proposals)
        .where(and(...conditions))
    : await db.select().from(proposals);
};

export const findById = async (id: number) => {
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, id));
  return proposal ?? null;
};

export const create = async (data: CreateProposalInput) => {
  const [created] = await db.insert(proposals).values(data).returning();
  return created;
};

export const update = async (id: number, data: UpdateProposalInput) => {
  const [updated] = await db
    .update(proposals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(proposals.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db
    .delete(proposals)
    .where(eq(proposals.id, id))
    .returning();
  return deleted ?? null;
};
