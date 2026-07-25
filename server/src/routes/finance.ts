// server/src/routes/finance.ts
import { Router } from "express";
import { aiInsightsRouter } from "../finance/ai-insights/routes.js";
import { approvalsRouter } from "../finance/approvals/routes.js";
import { budgetsRoutes } from "../finance/budget/routes.js";
import { cashFlowRouter } from "../finance/cash-flow/routes.js";
import { expensesRouter } from "../finance/expenses/routes.js";
import { procurementRouter } from "../finance/procurement/routes.js";
import { projectProfitabilityRouter } from "../finance/project-profitability/routes.js";
import { purchaseRequestsRouter } from "../finance/purchase-requests/routes.js";
import { reimbursementsRouter } from "../finance/reimbursements/routes.js";
import { reportsRouter } from "../finance/reports/routes.js";
import { risksRouter } from "../finance/risks/routes.js";
import { summaryRouter } from "../finance/summary/routes.js";

export const financeRouter = Router();

financeRouter.use("/budgets", budgetsRoutes);
financeRouter.use("/expenses", expensesRouter);
financeRouter.use("/purchase-requests", purchaseRequestsRouter);
financeRouter.use("/reimbursements", reimbursementsRouter);
financeRouter.use("/procurement", procurementRouter);
financeRouter.use("/approvals", approvalsRouter);
financeRouter.use("/ai-insights", aiInsightsRouter);
financeRouter.use("/risks", risksRouter);
financeRouter.use("/reports", reportsRouter);
financeRouter.use("/cash-flow", cashFlowRouter);
financeRouter.use("/project-profitability", projectProfitabilityRouter);
financeRouter.use("/summary", summaryRouter);

// Mount in app.ts:  app.use("/api/finance", financeRouter);`
