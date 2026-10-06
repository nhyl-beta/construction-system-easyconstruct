import type { Expense } from "@/features/finance/types/finance.types";
import { apiClient } from "@/services/api.client";
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
  /** Approved expenses of the current month, from /finance/summary (the cash flow definition). */
  monthlyApproved: number | null;
  /** Approve or reject a pending expense; refreshes the list and the summary. */
  decide: (id: string, decision: "approve" | "reject") => Promise<DecisionResult>;
}

export interface DecisionResult {
  ok: boolean;
  /** Non-fatal note from the server, e.g. no budget line matched. */
  warning: string | null;
  error: string | null;
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
  const [monthlyApproved, setMonthlyApproved] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    // The ledger pages client-side, so ask for a whole page of rows rather than
    // the server default of 20.
    params.set("pageSize", "500");
    if (query) params.set("query", query);
    if (category !== "all") params.set("category", category);

    // Was raw fetch() with no Authorization header — /api/finance now
    // requires a token (see app.ts), so this always 401'd.
    apiClient
      .get(`/finance/expenses?${params.toString()}`, { signal: controller.signal })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((json: any) => setExpenses(json.data ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err instanceof Error ? err.message : "Failed to load expenses.");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [query, category, reloadToken]);

  useEffect(() => {
    let active = true;
    apiClient
      .get("/finance/summary")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((json: any) => active && setMonthlyApproved(Number(json?.data?.monthlyExpenses ?? 0)))
      .catch(() => active && setMonthlyApproved(null));
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const decide = useCallback(async (id: string, decision: "approve" | "reject"): Promise<DecisionResult> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await apiClient.patch(`/finance/expenses/${encodeURIComponent(id)}/${decision}`, {});
      setReloadToken((t) => t + 1);
      return { ok: true, warning: json?.data?.warning ?? null, error: null };
    } catch (err) {
      // A 409 (already decided) means the list is stale; refresh it too.
      setReloadToken((t) => t + 1);
      return { ok: false, warning: null, error: err instanceof Error ? err.message : "Could not update the expense" };
    }
  }, []);

  const createExpense = useCallback(async (input: CreateExpenseInput) => {
    setCreating(true);
    setCreateError(null);
    try {
      await apiClient.post("/finance/expenses", input);
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
    monthlyApproved,
    decide,
  };
}
