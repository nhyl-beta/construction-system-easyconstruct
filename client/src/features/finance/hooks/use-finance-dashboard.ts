// client/src/features/finance/hooks/use-finance-dashboard.ts
import type {
  Approval,
  ApprovalList,
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
  /** Everything waiting on Finance, for the card badge (the list itself is capped). */
  approvalsTotal: number;
  /** Set when GET /finance/approvals failed, so the card does not pass it off as empty. */
  approvalsError: string | null;
  approvalsLoading: boolean;
  retryApprovals: () => void;
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
  const [approvalsTotal, setApprovalsTotal] = useState(0);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [approvalsToken, setApprovalsToken] = useState(0);
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

    // "risks" and "ai-insights" are the AI Insights surface — dropped
    // entirely rather than fetched and hidden, so the dashboard never calls
    // a route that doesn't exist for a feature that's off (see
    // config/features.ts). Under Promise.all a single 404 rejected the whole
    // batch, so allSettled lets the built endpoints render regardless.
    Promise.allSettled([
      getJson<Budget[]>("/finance/budgets", controller.signal),
      getJson<Expense[]>("/finance/expenses", controller.signal),
      getJson<CashFlowPoint[]>("/finance/cash-flow", controller.signal),
      getJson<ProjectProfitability[]>(
        "/finance/project-profitability",
        controller.signal,
      ),
      getJson<FinanceKpis>("/finance/summary", controller.signal),
    ])
      .then((results) => {
        const [b, e, cf, pp, k] = results;
        const value = <T,>(
          result: PromiseSettledResult<T>,
          fallback: T,
        ): T => (result.status === "fulfilled" ? result.value : fallback);

        setBudgets(value(b, []));
        setExpenses(value(e, []));
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

  // Pending approvals load on their own so a failure here is shown as a
  // failure (with Retry) rather than as an empty list, and retrying does not
  // reload the rest of the dashboard.
  useEffect(() => {
    const controller = new AbortController();
    setApprovalsLoading(true);
    setApprovalsError(null);
    getJson<ApprovalList>("/finance/approvals?limit=20", controller.signal)
      .then((list) => {
        setApprovals(list.items);
        setApprovalsTotal(list.total);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setApprovals([]);
        setApprovalsTotal(0);
        setApprovalsError(err instanceof Error ? err.message : "Could not load approvals");
      })
      .finally(() => {
        if (!controller.signal.aborted) setApprovalsLoading(false);
      });
    return () => controller.abort();
  }, [approvalsToken]);

  const retryApprovals = () => setApprovalsToken((t) => t + 1);

  return {
    budgets,
    expenses,
    approvals,
    approvalsTotal,
    approvalsError,
    approvalsLoading,
    retryApprovals,
    cashFlow,
    projectProfit,
    kpis,
    isLoading,
    error,
  };
}
