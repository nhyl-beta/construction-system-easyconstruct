import { apiClient } from "@/services/api.client";
import type { AuditLog, AuditLogsQuery } from "../types/audit-log.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

export const AuditLogRepository = {
  async list(query: AuditLogsQuery = {}): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (query.entityType) params.set("entityType", query.entityType);
    if (query.entityId) params.set("entityId", query.entityId);
    const qs = params.toString();
    return unwrap<AuditLog[]>(apiClient.get(`/audit-logs${qs ? `?${qs}` : ""}`));
  },
};
