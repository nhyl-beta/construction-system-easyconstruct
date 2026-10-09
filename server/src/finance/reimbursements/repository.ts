import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { reimbursements } from "../../db/schema/finance.js";

export type ReimbursementRow = typeof reimbursements.$inferSelect;
type Write = Pick<typeof db, "update" | "insert">;
type Read = Pick<typeof db, "select">;

export const reimbursementsRepository = {
  async findById(id: string, exec: Read = db): Promise<ReimbursementRow | null> {
    const [row] = await exec.select().from(reimbursements).where(eq(reimbursements.id, id));
    return row ?? null;
  },

  async findAll(exec: Read = db): Promise<ReimbursementRow[]> {
    return exec.select().from(reimbursements).orderBy(desc(reimbursements.submittedAt));
  },

  async findByClaimant(userId: number, exec: Read = db): Promise<ReimbursementRow[]> {
    return exec
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.claimantUserId, userId))
      .orderBy(desc(reimbursements.submittedAt));
  },

  /** Other live claims by the same person for the same amount on the same day. */
  async findLookalikes(claim: ReimbursementRow, exec: Read = db): Promise<ReimbursementRow[]> {
    if (claim.claimantUserId == null || claim.incurredOn == null) return [];
    const rows = await exec
      .select()
      .from(reimbursements)
      .where(
        and(
          eq(reimbursements.claimantUserId, claim.claimantUserId),
          eq(reimbursements.amount, claim.amount),
          eq(reimbursements.incurredOn, claim.incurredOn),
          inArray(reimbursements.status, ["pending-pm", "pending-finance", "approved", "paid"]),
        ),
      );
    return rows.filter((r) => r.id !== claim.id);
  },

  async insert(values: typeof reimbursements.$inferInsert, exec: Write = db): Promise<ReimbursementRow> {
    const [row] = await exec.insert(reimbursements).values(values).returning();
    return row!;
  },

  /** One conditional statement: undefined when the claim was not in any of `from`. */
  async transition(
    id: string,
    from: readonly string[],
    patch: Partial<typeof reimbursements.$inferInsert>,
    exec: Write = db,
  ): Promise<ReimbursementRow | undefined> {
    const [row] = await exec
      .update(reimbursements)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(reimbursements.id, id), inArray(reimbursements.status, [...from])))
      .returning();
    return row;
  },
};
