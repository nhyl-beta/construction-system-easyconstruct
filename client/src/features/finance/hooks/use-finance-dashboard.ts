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

    Promise.all([
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
      .then(([b, e, a, r, i, cf, pp, k]) => {
        setBudgets(b);
        setExpenses(e);
        setApprovals(a);
        setRisks(r);
        setInsights(i);
        setCashFlow(cf);
        setProjectProfit(pp);
        setKpis(k);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
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
