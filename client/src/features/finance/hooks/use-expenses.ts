import type { Expense } from "@/features/finance/types/finance.types";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface CreateExpenseInput {
  vendor: string;
  project: string;
  category: string;
  amount: number;
  receiptUrl?: string;
}

interface UseExpensesResult {
  expenses: Expense[];
  purchaseRequests: unknown[];
  reimbursements: unknown[];
  procurement: unknown[];
  breakdown: { category: string; amount: number }[];
  query: string;
  setQuery: (q: string) => void;
  category: string;
  setCategory: (c: string) => void;
  isLoading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  createExpense: (input: CreateExpenseInput) => Promise<boolean>;
}

export function useExpensesController(): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category !== "all") params.set("category", category);

    fetch(`/api/finance/expenses?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((json) => setExpenses(json.data ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [query, category, reloadToken]);

  const createExpense = useCallback(async (input: CreateExpenseInput) => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setReloadToken((t) => t + 1);
      return true;
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to record expense");
      return false;
    } finally {
      setCreating(false);
    }
  }, []);

  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) =>
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount),
    );
    return Array.from(map, ([cat, amount]) => ({ category: cat, amount }));
  }, [expenses]);

  return {
    expenses,
    purchaseRequests: [],
    reimbursements: [],
    procurement: [],
    breakdown,
    query,
    setQuery,
    category,
    setCategory,
    isLoading,
    error,
    creating,
    createError,
    createExpense,
  };
}
