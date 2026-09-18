import { useEffect, useMemo, useState } from "react";

import { useProjects } from "@/features/projects/hooks/useProjects";
import { useEngineeringReports } from "@/features/engineering-reports/hooks/useEngineeringReport";
import { useRequirements } from "@/features/requirements/hooks/useRequirements";
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

  return {
    loading: projectsState.loading || reportsState.loading || requirementsState.loading,

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