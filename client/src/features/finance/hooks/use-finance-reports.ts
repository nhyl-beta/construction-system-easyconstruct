import { useEffect, useState } from "react";
import type { ScheduledReport } from "@/features/finance/types/finance.types";

interface UseFinanceReportsResult {
  scheduledReports: ScheduledReport[];
  isLoading: boolean;
  error: string | null;
  exportReport: (reportId: string, format: "pdf" | "excel") => void;
}

export function useFinanceReportsController(): UseFinanceReportsResult {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/finance/reports", { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => setScheduledReports(json.data ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  // Placeholder — wire to a real export endpoint (e.g. GET /api/finance/reports/:id/export?format=pdf
  // returning a file stream) once report generation is implemented server-side.
  const exportReport = (reportId: string, format: "pdf" | "excel") => {
    window.open(`/api/finance/reports/${reportId}/export?format=${format}`, "_blank");
  };

  return { scheduledReports, isLoading, error, exportReport };
}