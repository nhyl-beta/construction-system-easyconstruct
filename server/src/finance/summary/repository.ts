import { eq, sql } from "drizzle-orm";
import { db } from "../../db/connection.js";
import {
  approvalsQueue,
  budgets,
  cashFlowEntries,
  expenses,
} from "../../db/schema/finance.js";
import { projectProfitabilityRepository } from "../project-profitability/repository.js";

export const summaryRepository = {
  async compute() {
    const [
      budgetTotals = {
        totalPlanned: "0",
        totalActual: "0",
      },
    ] = await db
      .select({
        totalPlanned: sql<string>`coalesce(sum(${budgets.planned}), 0)`,
        totalActual: sql<string>`coalesce(sum(${budgets.actual}), 0)`,
      })
      .from(budgets);

    const [
      monthlyExpenseTotals = {
        total: "0",
      },
    ] = await db
      .select({
        total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        sql`date_trunc('month', ${expenses.submittedAt}) = date_trunc('month', now())`,
      );

    const [
      pendingPayroll = {
        count: "0",
      },
    ] = await db
      .select({
        count: sql<string>`count(*)`,
      })
      .from(approvalsQueue)
      .where(eq(approvalsQueue.kind, "Payroll"));

    const recentCashFlow = await db
      .select()
      .from(cashFlowEntries)
      .orderBy(sql`${cashFlowEntries.id} desc`)
      .limit(1);

    const profitability = await projectProfitabilityRepository.compute();

    const avgMargin =
      profitability.length > 0
        ? profitability.reduce((sum, project) => sum + project.margin, 0) /
          profitability.length
        : 0;

    const totalPlanned = Number(budgetTotals.totalPlanned);
    const totalActual = Number(budgetTotals.totalActual);

    const latestCashFlow = recentCashFlow[0];

    return {
      totalBudget: totalPlanned,

      utilizationPct: totalPlanned > 0 ? totalActual / totalPlanned : 0,

      remainingBudget: totalPlanned - totalActual,

      monthlyExpenses: Number(monthlyExpenseTotals.total),

      pendingPayrollReviews: Number(pendingPayroll.count),

      outstandingInvoices: 0,

      cashFlowNet: latestCashFlow
        ? Number(latestCashFlow.inflow) - Number(latestCashFlow.outflow)
        : 0,

      profitMargin: avgMargin,
    };
  },
};
