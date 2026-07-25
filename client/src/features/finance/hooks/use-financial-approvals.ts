import { useCallback, useEffect, useState } from "react";
import type { Approval } from "@/features/finance/types/finance.types";

interface UseFinanceApprovalsResult {
  approvals: Approval[];
  isLoading: boolean;
  error: string | null;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
}

// TODO(Phase 7): swap for useTable + useUpdate on the "finance/approvals" resource.
export function useFinanceApprovalsController(): UseFinanceApprovalsResult {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/approvals");
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      setApprovals(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const decide = useCallback(
    async (id: string, decision: "approve" | "reject") => {
      const res = await fetch(`/api/finance/approvals/${id}/${decision}`, { method: "PATCH" });
      if (!res.ok) throw new Error(`${decision} failed: ${res.status}`);
      setApprovals((prev) => prev.filter((a) => a.id !== id)); // optimistic removal
    },
    [],
  );

  return {
    approvals,
    isLoading,
    error,
    approve: (id: string) => decide(id, "approve"),
    reject: (id: string) => decide(id, "reject"),
  };
}