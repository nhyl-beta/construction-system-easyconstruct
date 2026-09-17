// client/src/features/issues/hooks/use-issues.ts — NEW
import { useCallback, useEffect, useState } from "react";
import {
  issuesRepository,
  type IssueRecord,
  type UpdateIssueStatusInput,
} from "../repositories/issues.repository";

// General (not scoped to "my own") issues list — used by reviewers
// (Engineer/PM) who need to see and act on every reported issue, backed by
// the same `/issues` table Site Personnel's report form writes to.
export function useIssues() {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await issuesRepository.list();
      setIssues(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (id: number, input: UpdateIssueStatusInput) => {
      setUpdating(id);
      setError(null);
      try {
        const res = await issuesRepository.updateStatus(id, input);
        setIssues((prev) => prev.map((i) => (i.id === id ? res.data : i)));
        return res.data;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update issue";
        setError(message);
        return null;
      } finally {
        setUpdating(null);
      }
    },
    [],
  );

  return { issues, loading, error, updating, updateStatus, refresh };
}
