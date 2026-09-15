import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CreateEngineeringReportInput,
  EngineeringReport,
} from "../types/engineering-reports.types";
import { EngineeringReportService } from "../services/engineering-report.service";

type Scope = "progress" | "issues" | "all";

export function useEngineeringReportsController(scope: Scope = "all") {
  const [reports, setReports] = useState<EngineeringReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await EngineeringReportService.fetchAll({ search });
      setReports(all);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const scoped = useMemo(() => {
    if (scope === "progress") return EngineeringReportService.onlyProgress(reports);
    if (scope === "issues") return EngineeringReportService.onlyIssues(reports);
    return reports;
  }, [reports, scope]);

  const createReport = useCallback(
    async (payload: CreateEngineeringReportInput) => {
      await EngineeringReportService.createReport(payload);
      await load();
    },
    [load],
  );

  return {
    reports: scoped,
    allReports: reports,
    loading,
    error,
    search,
    setSearch,
    createReport,
    reload: load,
  } as const;
}