import { useEffect, useMemo, useState } from "react";
import type { Budget, BudgetTotals } from "../types/budget.types";

export const useBudgetsController = (initialQuery = "") => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [fy, setFy] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (fy !== "all") params.set("fiscalYear", fy);

    fetch(`/api/finance/budgets?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setBudgets(json.data ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query, fy]);

  const totals: BudgetTotals = useMemo(() => {
    const planned = budgets.reduce((s, b) => s + b.planned, 0);
    const committed = budgets.reduce((s, b) => s + b.committed, 0);
    const spent = budgets.reduce((s, b) => s + b.spent, 0);
    return { planned, committed, spent, remaining: planned - spent };
  }, [budgets]);

  return { budgets, totals, loading, query, setQuery, fy, setFy };
};