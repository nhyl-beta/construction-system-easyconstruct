// Data hooks for RFI/RFA requests and transmittals. Same shape everywhere:
// { data, loading, error, reload } with a stale-response guard.
import { useCallback, useEffect, useState } from "react";
import { RequestRepository, TransmittalRepository } from "../repositories/request.repository";
import type {
  Assignee,
  AttentionData,
  DesignRequest,
  DesignRequestDetail,
  RequestFilters,
  Transmittal,
} from "../types/request.types";

function useAsync<T>(load: () => Promise<T>, deps: unknown[], initial: T, enabled = true) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    load()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { data, loading, error, reload } as const;
}

export function useRequests(filters: RequestFilters) {
  const r = useAsync<DesignRequest[]>(
    () => RequestRepository.list(filters),
    [filters.projectCode, filters.kind, filters.status, filters.search, filters.box, filters.overdue],
    [],
  );
  return { requests: r.data, loading: r.loading, error: r.error, reload: r.reload };
}

export function useRequestDetail(id: number | null) {
  const r = useAsync<DesignRequestDetail | null>(() => (id ? RequestRepository.get(id) : Promise.resolve(null)), [id], null, id != null);
  return { request: r.data, loading: r.loading, error: r.error, reload: r.reload };
}

export function useAssignees(projectCode: string) {
  const r = useAsync<Assignee[]>(() => (projectCode ? RequestRepository.assignees(projectCode) : Promise.resolve([])), [projectCode], [], !!projectCode);
  return { assignees: r.data, loading: r.loading, error: r.error };
}

export function useAttention(enabled: boolean) {
  const r = useAsync<AttentionData | null>(() => RequestRepository.attention(), [], null, enabled);
  return { attention: r.data, loading: r.loading, error: r.error, reload: r.reload };
}

export function useTransmittals(projectCode?: string) {
  const r = useAsync<Transmittal[]>(() => TransmittalRepository.list(projectCode), [projectCode], []);
  return { transmittals: r.data, loading: r.loading, error: r.error, reload: r.reload };
}
