import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { assertProjectWritable } from "../../lifecycle/service.js";
import { expensesRepository } from "./repository.js";
import * as budgetRepo from "../budget/repository.js";
import type { CreateExpenseInput, ListExpensesQuery } from "./types.js";
import { scoreExpense } from "./anomaly.js";
import { FEATURES } from "../../config/features.js";

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

  async approve(id: string) {
    const existing = await expensesRepository.findById(id);
    if (!existing) throw new NotFoundError("Expense", id);
    await assertProjectWritable(existing.project);
    const row = await expensesRepository.updateStatus(id, "approved");
    if (!row) {
      throw new NotFoundError("Expense", id);
    }
    // G6: an approved expense is real spend against the budget it matches
    // on (project, category) — best-effort match, same as G5's payroll link.
    const budget = await budgetRepo.findByProjectAndCategory(row.project, row.category);
    if (budget) {
      await budgetRepo.update(budget.id, { spent: budget.spent + row.amount });
    }
    return row;
  },

  async reject(id: string) {
    const existing = await expensesRepository.findById(id);
    if (!existing) throw new NotFoundError("Expense", id);
    await assertProjectWritable(existing.project);
    const row = await expensesRepository.updateStatus(id, "rejected");
    if (!row) {
      throw new NotFoundError("Expense", id);
    }
    return row;
  },
};
