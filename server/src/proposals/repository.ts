import { db } from "../db/connection.js";
import {
  proposals,
  type NewProposal,
} from "../db/schema/proposals.js";

import { desc, eq } from "drizzle-orm";

export const proposalRepository = {
  async findAll() {
    // Explicit descending order by id, so a newly-submitted proposal appears
    // at the top of the table instead of at the bottom where reviewers were
    // least likely to see it. Without an ORDER BY at all, Postgres gives no
    // ordering guarantee, so the proposal tables reshuffled between loads.
    return db
      .select()
      .from(proposals)
      .orderBy(desc(proposals.id));
  },

  async findById(id: number) {
    const result = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, id));

    return result[0];
  },

  async create(data: NewProposal) {
    const result = await db
      .insert(proposals)
      .values(data)
      .returning();

    return result[0];
  },

  async update(
    id: number,
    data: Partial<NewProposal>,
  ) {
    const result = await db
      .update(proposals)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, id))
      .returning();

    return result[0];
  },

  async review(
    id: number,
    data: {
      status:
        | "Approved"
        | "Revision Requested"
        | "Rejected";

      reviewerName: string;
      reviewComment: string;
    },
  ) {
    const result = await db
      .update(proposals)
      .set({
        status: data.status,
        reviewerName: data.reviewerName,
        reviewComment: data.reviewComment,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, id))
      .returning();

    return result[0];
  },

  async remove(id: number) {
    const result = await db
      .delete(proposals)
      .where(eq(proposals.id, id))
      .returning();

    return result[0];
  },
};