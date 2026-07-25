import { sql } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { budgets, expenses } from "../../db/schema/finance.js";

/**
 * Derived, read-only rollup: treats a project's planned budget as "revenue"
 * and its summed actual expenses as "cost". There is no dedicated
 * profitability table — this is computed on read. Revisit this definition
 * with Finance stakeholders once real contract-value data exists; planned
 * budget is a placeholder for revenue, not a precise accounting figure.
 */

export const projectProfitabilityRepository = {
  async compute() {
    const rows = await db
      .select({
        project: budgets.project,
        revenue: sql<string>`sum(${budgets.planned})`,
        cost: sql<string>`coalesce((
          select sum(${expenses.amount}) from ${expenses}
          where ${expenses.project} = ${budgets.project}
        ), 0)`,
      })
      .from(budgets)
      .groupBy(budgets.project);

    return rows.map((r) => {
      const revenue = Number(r.revenue);
      const cost = Number(r.cost);
      const margin = revenue > 0 ? (revenue - cost) / revenue : 0;
      return { project: r.project, revenue, cost, margin };
    });
  },
};