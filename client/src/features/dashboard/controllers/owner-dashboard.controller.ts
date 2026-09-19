import { useMemo } from "react";

import { useAuditLogs } from "@/features/audit-logs/hooks/useAuditLogs";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useProposals } from "@/features/proposals/hooks/useProposals";
import { useActiveWorkflows, useApprovals } from "@/features/workflows/hooks/useWorkflows";

// Owner is read-only, so this is the Admin controller's org-wide picture
// minus everything Admin uses to act on it (notifications to triage, the
// per-project drill-in). Every number below comes from a GET the Owner role
// is actually authorized for.
export const useOwnerDashboardController = () => {
  const projects = useProjects();
  const workflows = useActiveWorkflows();
  const approvals = useApprovals("pending");
  const auditLogs = useAuditLogs();
  const proposals = useProposals();

  const overBudget = useMemo(
    () => projects.projects.filter((p) => p.budget > 100).length,
    [projects.projects],
  );

  const activeWorkflowCount = useMemo(
    () => workflows.workflows.filter((w) => w.status === "active").length,
    [workflows.workflows],
  );

  const completedWorkflowCount = useMemo(
    () => workflows.workflows.filter((w) => w.status === "completed").length,
    [workflows.workflows],
  );

  // Same risk-weighted ordering the Admin and PM dashboards use, so the
  // executive view and the operational views agree on what "at risk" means.
  const attentionSorted = useMemo(() => {
    const riskWeight: Record<string, number> = { high: 2, medium: 1, low: 0 };
    return [...projects.projects].sort((a, b) => {
      const riskDiff = riskWeight[b.risk] - riskWeight[a.risk];
      if (riskDiff !== 0) return riskDiff;
      return b.budget - a.budget;
    });
  }, [projects.projects]);

  const recentActivity = useMemo(() => auditLogs.logs.slice(0, 8), [auditLogs.logs]);

  // The audit trail is the only org-wide record of who is doing what, so the
  // executive view summarises it by actor rather than listing it twice.
  const topActors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of auditLogs.logs) {
      counts.set(log.actor, (counts.get(log.actor) ?? 0) + 1);
    }
    return Array.from(counts, ([actor, count]) => ({ actor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [auditLogs.logs]);

  const loading = projects.loading || workflows.loading || approvals.loading;

  return {
    loading,

    projectsLoading: projects.loading,
    projectsError: projects.error,
    kpis: projects.kpis,
    overBudget,
    totalProjectCount: projects.projects.length,
    topProjects: attentionSorted.slice(0, 5),

    workflowsLoading: workflows.loading,
    activeWorkflowCount,
    completedWorkflowCount,

    approvalsLoading: approvals.loading,
    pendingApprovals: approvals.stats?.pending ?? approvals.items.length,
    overdueApprovals: approvals.stats?.overdue ?? 0,

    auditLogsLoading: auditLogs.loading,
    auditLogsError: auditLogs.error,
    auditEventCount: auditLogs.logs.length,
    recentActivity,
    topActors,

    proposalsLoading: proposals.loading,
    proposalsKpis: proposals.kpis,
  } as const;
};

export default useOwnerDashboardController;
