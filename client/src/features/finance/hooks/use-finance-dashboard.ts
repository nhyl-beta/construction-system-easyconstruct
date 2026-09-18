// client/src/features/finance/hooks/use-finance-dashboard.ts
import type {
  AIInsight,
  Approval,
  Budget,
  CashFlowPoint,
  Expense,
  FinanceKpis,
  FinancialRisk,
  ProjectProfitability,
} from "@/features/finance/types/finance.types";
import { useEffect, useState } from "react";

interface UseFinanceDashboardResult {
  budgets: Budget[];
  expenses: Expense[];
  approvals: Approval[];
  risks: FinancialRisk[];
  insights: AIInsight[];
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

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

export function useFinanceDashboardController(): UseFinanceDashboardResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [risks, setRisks] = useState<FinancialRisk[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
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

    // Three of these routers (approvals, risks, ai-insights) are still
    // commented out in server/src/routes/finance.ts. Under Promise.all a
    // single 404 rejected the batch, so the whole dashboard showed an error
    // banner and zeroed KPIs even though budgets/expenses/cash-flow/summary
    // all answered. allSettled lets the built endpoints render and degrades
    // the unbuilt ones to empty.
    Promise.allSettled([
      getJson<Budget[]>("/api/finance/budgets", controller.signal),
      getJson<Expense[]>("/api/finance/expenses", controller.signal),
      getJson<Approval[]>("/api/finance/approvals", controller.signal),
      getJson<FinancialRisk[]>("/api/finance/risks", controller.signal),
      getJson<AIInsight[]>("/api/finance/ai-insights", controller.signal),
      getJson<CashFlowPoint[]>("/api/finance/cash-flow", controller.signal),
      getJson<ProjectProfitability[]>(
        "/api/finance/project-profitability",
        controller.signal,
      ),
      getJson<FinanceKpis>("/api/finance/summary", controller.signal),
    ])
      .then((results) => {
        const [b, e, a, r, i, cf, pp, k] = results;
        const value = <T,>(
          result: PromiseSettledResult<T>,
          fallback: T,
        ): T => (result.status === "fulfilled" ? result.value : fallback);

        setBudgets(value(b, []));
        setExpenses(value(e, []));
        setApprovals(value(a, []));
        setRisks(value(r, []));
        setInsights(value(i, []));
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
    risks,
    insights,
    cashFlow,
    projectProfit,
    kpis,
    isLoading,
    error,
  };
}
