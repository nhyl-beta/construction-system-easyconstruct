import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { assertProjectWritable } from "../../lifecycle/service.js";
import { expensesRepository } from "./repository.js";
import type { CreateExpenseInput, ListExpensesQuery } from "./types.js";
import { scoreExpense } from "./anomaly.js";
import { FEATURES } from "../../config/features.js";
import { db } from "../../db/connection.js";
import { budgets } from "../../db/schema/finance.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { assertDecidable, budgetOutcome } from "./decision.js";
import { monthKey } from "../cash-flow/months.js";
import { refreshMonth } from "../cash-flow/service.js";

/** Scores one expense against every other expense (decision support; never blocks). */
async function scoreAndStore(id: string) {
  const all = await expensesRepository.findAllForAnomaly();
  const candidate = all.find((e) => e.id === id);
  if (!candidate) return;
  const { score, reasons } = scoreExpense(candidate, all);
  await expensesRepository.setAnomaly(id, score, reasons.length ? reasons.join("; ") : null);
}

export const expensesService = {
  async list(queryParams: ListExpensesQuery) {
    return expensesRepository.findMany(queryParams);
  },

  async create(input: CreateExpenseInput) {
    if (input.amount <= 0) {
      throw new ValidationError("Amount must be greater than zero");
    }
    await assertProjectWritable(input.project);
    const created = await expensesRepository.create(input);
    if (!FEATURES.ai || !created) return created;
    // Rule-based anomaly check; a failure here must never fail the create.
    await scoreAndStore(created.id).catch((e) => console.error("[expenses] anomaly scoring failed", e));
    return (await expensesRepository.findById(created.id)) ?? created;
  },

  /** Re-scores every expense (e.g. after rows were added by a seed or import). Admin / Finance. */
  async rescoreAll() {
    if (!FEATURES.ai) return { scored: 0, flagged: 0, enabled: false };
    const all = await expensesRepository.findAllForAnomaly();
    let flagged = 0;
    for (const e of all) {
      const { score, reasons } = scoreExpense(e, all);
      await expensesRepository.setAnomaly(e.id, score, reasons.length ? reasons.join("; ") : null);
      if (score >= 0.3) flagged += 1;
    }
    return { scored: all.length, flagged, enabled: true };
  },

  /**
   * Approving is real spend: in ONE transaction the expense leaves "pending",
   * the matching budget line (project + category) grows by the amount with an
   * atomic `actual = actual + amount`, and that month's cash flow outflow is
   * recomputed. A second approval is a 409 and changes nothing. With no
   * matching budget line the expense is still approved, and the caller is told.
   */
  async approve(id: string) {
    const existing = await expensesRepository.findById(id);
    if (!existing) throw new NotFoundError("Expense", id);
    await assertProjectWritable(existing.project);

    const { row, matched } = await db.transaction(async (tx) => {
      const decided = await expensesRepository.decideIfPending(id, "approved", tx);
      if (!decided) {
        const current = await expensesRepository.findById(id);
        if (!current) throw new NotFoundError("Expense", id);
        assertDecidable(id, current.status);
        throw new NotFoundError("Expense", id);
      }
      const [budget] = await tx
        .select({ id: budgets.id })
        .from(budgets)
        .where(and(eq(budgets.project, decided.project), eq(budgets.category, decided.category)))
        .orderBy(desc(budgets.createdAt))
        .limit(1);
      if (budget) {
        await tx
          .update(budgets)
          .set({ actual: sql`${budgets.actual} + ${decided.amount}`, updatedAt: new Date() })
          .where(eq(budgets.id, budget.id));
      }
      await refreshMonth(monthKey(decided.submittedAt), tx);
      return { row: decided, matched: budget != null };
    });
    return { ...row, ...budgetOutcome(matched) };
  },

  async reject(id: string) {
    const existing = await expensesRepository.findById(id);
    if (!existing) throw new NotFoundError("Expense", id);
    await assertProjectWritable(existing.project);
    // Rejecting never touches a budget or the cash flow.
    const row = await expensesRepository.decideIfPending(id, "rejected");
    if (!row) {
      const current = await expensesRepository.findById(id);
      if (!current) throw new NotFoundError("Expense", id);
      assertDecidable(id, current.status);
      throw new NotFoundError("Expense", id);
    }
    return row;
  },
};