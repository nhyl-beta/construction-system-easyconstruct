import { useCallback, useEffect, useState } from "react";

import { PayrollSummaryRepository } from "../repositories/payroll-summary.repository";
import type { PayrollSummary } from "../types/payroll-summary.types";

/** Trend length the Owner dashboard asks for (server clamps to 1–24). */
export const OWNER_TREND_MONTHS = 6;

export function usePayrollSummary(months: number = OWNER_TREND_MONTHS) {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await PayrollSummaryRepository.get(months));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load the payroll summary."));
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { summary, loading, error, reload } as const;
}
