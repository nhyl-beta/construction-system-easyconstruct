import { useMemo } from "react";
import { useProjects } from "@/features/projects/hooks/useProjects";

export const usePmDashboardController = () => {
  const projects = useProjects();

  // Same status-string matching approach as ProjectService.calcKpis,
  // but scoped to what the dashboard actually displays (risk breakdown
  // instead of just counts).
  const riskBreakdown = useMemo(() => {
    const high = projects.projects.filter((p) => p.risk === "high").length;
    const medium = projects.projects.filter((p) => p.risk === "medium").length;
    const low = projects.projects.filter((p) => p.risk === "low").length;
    return { high, medium, low };
  }, [projects.projects]);

  const overBudget = useMemo(
    () => projects.projects.filter((p) => p.budget > 100).length,
    [projects.projects],
  );

  // Attention-sorted: risk desc, then budget overrun desc — surfaces the
  // projects most likely to need the PM's attention today, without
  // fabricating a separate "attention score" concept.
  const attentionSorted = useMemo(() => {
    const riskWeight: Record<string, number> = { high: 2, medium: 1, low: 0 };
    return [...projects.projects].sort((a, b) => {
      const riskDiff = riskWeight[b.risk] - riskWeight[a.risk];
      if (riskDiff !== 0) return riskDiff;
      return b.budget - a.budget;
    });
  }, [projects.projects]);

  return {
    loading: projects.loading,
    error: projects.error,
    kpis: projects.kpis,
    riskBreakdown,
    overBudget,
    topProjects: attentionSorted.slice(0, 5),
    totalProjectCount: projects.projects.length,
  };
};