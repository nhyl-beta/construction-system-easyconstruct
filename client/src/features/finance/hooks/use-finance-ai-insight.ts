import type {
  AIInsight,
  FinancialRisk,
} from "@/features/finance/types/finance.types";
import { useCallback, useEffect, useState } from "react";

interface UseFinanceAiInsightsResult {
  insights: AIInsight[];
  risks: FinancialRisk[];
  isLoading: boolean;
  error: string | null;
  acknowledge: (id: string) => Promise<void>;
  dismiss: (id: string) => void;
}

export function useFinanceAiInsightsController(): UseFinanceAiInsightsResult {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [risks, setRisks] = useState<FinancialRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/finance/ai-insights", { signal: controller.signal }).then(
        (r) => r.json(),
      ),
      fetch("/api/finance/risks", { signal: controller.signal }).then((r) =>
        r.json(),
      ),
    ])
      .then(([insightsJson, risksJson]) => {
        setInsights(insightsJson.data ?? []);
        setRisks(risksJson.data ?? []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  // Acknowledge is a client-side dismissal for now — add a persisted
  // "acknowledged_at" column on ai_insights if this needs to survive reloads.
  const acknowledge = useCallback(async (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const dismiss = useCallback((id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { insights, risks, isLoading, error, acknowledge, dismiss };
}
