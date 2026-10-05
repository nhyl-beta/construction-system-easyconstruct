// server/src/finance/cash-flow/service.ts
//
// Keeps one `cash_flow_entries` row per month in step with the approved
// expense and payroll records. The outflow is RECOMPUTED from the records
// (never incremented), so a retry or a double click cannot make it drift.
// Inflow is not derived from anything — there is no client-payment record — and
// is left untouched.
import { db } from "../../db/connection.js";
import { cashFlowEntries } from "../../db/schema/finance.js";
import { keyToLabel, round2 } from "./months.js";
import { expenseOutflowByMonth, payrollOutflowByMonth, type Executor } from "./sources.js";

export type WriteExecutor = Executor & Pick<typeof db, "insert">;

/** Recomputes the outflow of the month `monthKey` ("2026-03") and upserts its row. */
export const refreshMonth = async (monthKey: string, exec: WriteExecutor = db) => {
  const [expense, payroll] = await Promise.all([expenseOutflowByMonth(exec), payrollOutflowByMonth(exec)]);
  const outflow = round2((expense.get(monthKey) ?? 0) + (payroll.get(monthKey) ?? 0));
  await exec
    .insert(cashFlowEntries)
    .values({ month: keyToLabel(monthKey), inflow: 0, outflow })
    .onConflictDoUpdate({ target: cashFlowEntries.month, set: { outflow } });
  return outflow;
};
