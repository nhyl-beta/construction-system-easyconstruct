import { useMemo } from "react";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useActiveWorkflows, useApprovals } from "@/features/workflows/hooks/useWorkflows";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useAuditLogs } from "@/features/audit-logs/hooks/useAuditLogs";
import { useProposals } from "@/features/proposals/hooks/useProposals";

export const useAdminDashboardController = () => {
  const projects = useProjects();
  const workflows = useActiveWorkflows();
  const approvals = useApprovals("pending");
  const notifications = useNotifications();
  const auditLogs = useAuditLogs();
  const proposals = useProposals();

  // Same risk-weighted sort the PM dashboard uses for "needs attention" —
  // kept identical so both dashboards read the same data the same way.
  const attentionSorted = useMemo(() => {
    const riskWeight: Record<string, number> = { high: 2, medium: 1, low: 0 };
    return [...projects.projects].sort((a, b) => {
      const riskDiff = riskWeight[b.risk] - riskWeight[a.risk];
      if (riskDiff !== 0) return riskDiff;
      return b.budget - a.budget;
    });
  }, [projects.projects]);

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

  const unreadNotificationCount = useMemo(
    () => notifications.notifications.filter((n) => !n.isRead).length,
    [notifications.notifications],
  );

  const recentActivity = useMemo(
    () => auditLogs.logs.slice(0, 6),
    [auditLogs.logs],
  );

  const recentNotifications = useMemo(
    () => notifications.notifications.slice(0, 6),
    [notifications.notifications],
  );

  const loading =
    projects.loading || workflows.loading || approvals.loading;

  return {
    loading,
    projectsLoading: projects.loading,
    projectsError: projects.error,
    kpis: projects.kpis,
    overBudget,
    topProjects: attentionSorted.slice(0, 5),
    totalProjectCount: projects.projects.length,

    workflowsLoading: workflows.loading,
    workflowsError: workflows.error,
    activeWorkflowCount,
    completedWorkflowCount,

    approvalsLoading: approvals.loading,
    pendingApprovals: approvals.stats?.pending ?? approvals.items.length,
    overdueApprovals: approvals.stats?.overdue ?? 0,

    notificationsLoading: notifications.loading,
    unreadNotificationCount,
    recentNotifications,

    auditLogsLoading: auditLogs.loading,
    recentActivity,

    proposalsLoading: proposals.loading,
    proposalsKpis: proposals.kpis,
  };
};
