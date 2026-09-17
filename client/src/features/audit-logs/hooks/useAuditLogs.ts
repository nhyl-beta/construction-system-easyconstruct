import { useCallback, useEffect, useState } from "react";
import { AuditLogRepository } from "../repositories/audit-log.repository";
import type { AuditLog, AuditLogsQuery } from "../types/audit-log.types";

export function useAuditLogs(query: AuditLogsQuery = {}) {
  const { entityType, entityId } = query;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await AuditLogRepository.list({ entityType, entityId });
      setLogs(result);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load activity logs."),
      );
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { logs, loading, error, reload } as const;
}
