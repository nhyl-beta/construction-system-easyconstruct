import { db } from "../db/connection.js";
import {
  proposals,
  type NewProposal,
} from "../db/schema/proposals.js";

import { eq } from "drizzle-orm";

export const proposalRepository = {
  async findAll() {
    return db
      .select()
      .from(proposals);
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