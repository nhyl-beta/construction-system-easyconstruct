import { useEffect, useMemo, useState } from "react";

import { useProjects } from "@/features/projects/hooks/useProjects";
import { useEngineeringReports } from "@/features/engineering-reports/hooks/useEngineeringReport";
import { useRequirements } from "@/features/requirements/hooks/useRequirements";
import { useIssues } from "@/features/issues/hooks/use-issues";
import { EngineeringReportService } from "@/features/engineering-reports/services/engineering-report.service";
import { RequirementService } from "@/features/requirements/services/requirement.service";
import { useAuth } from "@/auth/auth-context";
import { ProjectMemberRepository } from "@/features/project-members/repositories/project-member.repository";

// Composes the Engineer dashboard from real feature hooks (Projects,
// Engineering reports, Requirements) — same pattern as
// useArchitectDashboardController / usePMDashboardController.
export const useEngineerDashboardController = () => {
  const { user } = useAuth();
  const projectsState = useProjects();
  const reportsState = useEngineeringReports("all");
  const requirementsState = useRequirements();
  // /api/issues is the field-reported issue queue Site Personnel writes to
  // and Engineer resolves — distinct from engineering_reports, which are
  // the Engineer's own written inspections.
  const issuesState = useIssues();

  // Project Assignment (checklist #3): only show projects this engineer is
  // actually staffed on, via the project_members join table — the old
  // `p.assignedEngineer` field no longer exists on the projects schema
  // (renamed away in migration 0009), so it always compared against
  // `undefined` and this KPI was permanently empty.
  const [assignedCodes, setAssignedCodes] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setAssignedCodes(new Set());
      return;
    }
    ProjectMemberRepository.listForUser(user.id)
      .then((rows) => {
        // project_members now covers every role (EC-013/017/018/024) — this
        // dashboard only cares about the engineer's own assignments.
        if (!cancelled) {
          setAssignedCodes(
            new Set(rows.filter((r) => r.role === "engineer").map((r) => r.projectCode)),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setAssignedCodes(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const assignedProjects = useMemo(
    () => projectsState.projects.filter((p) => assignedCodes.has(p.code)),
    [projectsState.projects, assignedCodes],
  );

  const issueReports = EngineeringReportService.onlyIssues(reportsState.reports);
  const progressReports = EngineeringReportService.onlyProgress(reportsState.reports);
  const criticalIssues = EngineeringReportService.countByPriority(issueReports, "Critical");
  const pendingRequirements = RequirementService.countByStatus(
    requirementsState.requirements,
    "Under Review",
  );

  // Field-issue analytics, scoped to the projects this engineer is staffed on
  // so the numbers match the "Assigned projects" KPI above them.
  const assignedIssues = useMemo(
    () => issuesState.issues.filter((i) => assignedCodes.has(i.projectCode)),
    [issuesState.issues, assignedCodes],
  );

  const issueStats = useMemo(() => {
    const open = assignedIssues.filter((i) => i.status === "Submitted").length;
    const underReview = assignedIssues.filter((i) => i.status === "Under Review").length;
    const resolved = assignedIssues.filter((i) => i.status === "Resolved").length;
    const total = assignedIssues.length;
    return {
      total,
      open,
      underReview,
      resolved,
      // Share of issues raised against these projects that have been closed
      // out. Zero issues reads as 100% — nothing outstanding.
      resolutionRate: total === 0 ? 100 : Math.round((resolved / total) * 100),
    };
  }, [assignedIssues]);

  // Mean completion across the engineer's own projects, so progress is
  // visible without opening each one.
  const averageProgress = useMemo(() => {
    if (assignedProjects.length === 0) return 0;
    const sum = assignedProjects.reduce((acc, p) => acc + (p.progress ?? 0), 0);
    return Math.round(sum / assignedProjects.length);
  }, [assignedProjects]);

  return {
    loading:
      projectsState.loading ||
      reportsState.loading ||
      requirementsState.loading ||
      issuesState.loading,

    issues: issueStats,
    averageProgress,

    assignedProjects,
    assignedProjectCount: assignedProjects.length,

    reports: {
      total: reportsState.reports.length,
      progressCount: progressReports.length,
      issueCount: issueReports.length,
      criticalIssues,
      // Already ordered by updatedAt desc from the repository (both API and
      // mock mode), so just take the first 5 rather than re-sorting a
      // formatted "2h ago" string, which wouldn't sort correctly anyway.
      recent: reportsState.reports.slice(0, 5),
    },

    requirements: {
      total: requirementsState.requirements.length,
      pending: pendingRequirements,
    },
  } as const;
};