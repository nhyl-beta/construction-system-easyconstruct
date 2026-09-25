import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CreateEngineeringReportInput,
  EngineeringReport,
} from "../types/engineering-reports.types";
import { EngineeringReportService } from "../services/engineering-report.service";
import { EngineeringReportRepository } from "../repositories/engineering-report.repository";

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

  const [deciding, setDeciding] = useState<number | null>(null);

  // Q5: PM/Admin approving (or rejecting/requesting revision on) a
  // submitted report — server/src/engineering-reports/service.ts's
  // assertCanSetStatus enforces who may actually do this; a 403 here
  // surfaces through `error` the same as any other failed load.
  const decide = useCallback(
    async (dbId: number, status: EngineeringReport["status"]) => {
      setDeciding(dbId);
      setError(null);
      try {
        await EngineeringReportRepository.updateStatus(dbId, status);
        await load();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err);
      } finally {
        setDeciding(null);
      }
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
    decide,
    deciding,
    reload: load,
  } as const;
}