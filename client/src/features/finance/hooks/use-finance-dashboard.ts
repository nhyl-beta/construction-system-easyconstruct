// client/src/features/finance/hooks/use-finance-dashboard.ts
import type {
  Approval,
  Budget,
  CashFlowPoint,
  Expense,
  FinanceKpis,
  ProjectProfitability,
} from "@/features/finance/types/finance.types";
import { useEffect, useState } from "react";
import { apiClient } from "@/services/api.client";

interface UseFinanceDashboardResult {
  budgets: Budget[];
  expenses: Expense[];
  approvals: Approval[];
  cashFlow: CashFlowPoint[];
  projectProfit: ProjectProfitability[];
  kpis: FinanceKpis;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_KPIS: FinanceKpis = {
  totalBudget: 0,
  utilizationPct: 0,
  remainingBudget: 0,
  monthlyExpenses: 0,
  pendingPayrollReviews: 0,
  outstandingInvoices: 0,
  cashFlowNet: 0,
  profitMargin: 0,
};

// Routed through apiClient (not raw fetch) so the Authorization header goes
// out — /api/finance now requires a token (see app.ts), and a bare fetch()
// here would 401 on every call.
async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await apiClient.get(path, { signal });
  return json.data as T;
}

export function useFinanceDashboardController(): UseFinanceDashboardResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([]);
  const [projectProfit, setProjectProfit] = useState<ProjectProfitability[]>(
    [],
  );
  const [kpis, setKpis] = useState<FinanceKpis>(EMPTY_KPIS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    // "approvals" is still commented out in server/src/routes/finance.ts.
    // "risks" and "ai-insights" are the AI Insights surface — dropped
    // entirely rather than fetched and hidden, so the dashboard never calls
    // a route that doesn't exist for a feature that's off (see
    // config/features.ts). Under Promise.all a single 404 rejected the whole
    // batch, so allSettled lets the built endpoints render regardless.
    Promise.allSettled([
      getJson<Budget[]>("/finance/budgets", controller.signal),
      getJson<Expense[]>("/finance/expenses", controller.signal),
      getJson<Approval[]>("/finance/approvals", controller.signal),
      getJson<CashFlowPoint[]>("/finance/cash-flow", controller.signal),
      getJson<ProjectProfitability[]>(
        "/finance/project-profitability",
        controller.signal,
      ),
      getJson<FinanceKpis>("/finance/summary", controller.signal),
    ])
      .then((results) => {
        const [b, e, a, cf, pp, k] = results;
        const value = <T,>(
          result: PromiseSettledResult<T>,
          fallback: T,
        ): T => (result.status === "fulfilled" ? result.value : fallback);

        setBudgets(value(b, []));
        setExpenses(value(e, []));
        setApprovals(value(a, []));
        setCashFlow(value(cf, []));
        setProjectProfit(value(pp, []));
        setKpis(value(k, EMPTY_KPIS));

        const aborted = results.some(
          (result) =>
            result.status === "rejected" && result.reason?.name === "AbortError",
        );
        // Only complain if nothing at all came back — a partial load is the
        // expected state until the remaining finance routers are built.
        const allFailed = results.every((result) => result.status === "rejected");
        if (!aborted && allFailed) {
          const first = results.find((result) => result.status === "rejected");
          setError(
            first && first.status === "rejected"
              ? String(first.reason?.message ?? first.reason)
              : "Finance data is unavailable.",
          );
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  return {
    budgets,
    expenses,
    approvals,
    cashFlow,
    projectProfit,
    kpis,
    isLoading,
    error,
  };
}
