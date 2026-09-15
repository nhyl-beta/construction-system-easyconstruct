import { useMemo } from "react";

import { useProjects } from "@/features/projects/hooks/useProjects";
import { useEngineeringReports } from "@/features/engineering-reports/hooks/useEngineeringReport";
import { useRequirements } from "@/features/requirements/hooks/useRequirements";
import { EngineeringReportService } from "@/features/engineering-reports/services/engineering-report.service";
import { RequirementService } from "@/features/requirements/services/requirement.service";
import { useAuth } from "@/auth/auth-context";

// Composes the Engineer dashboard from real feature hooks (Projects,
// Engineering reports, Requirements) — same pattern as
// useArchitectDashboardController / usePMDashboardController.
export const useEngineerDashboardController = () => {
  const { user } = useAuth();
  const projectsState = useProjects();
  const reportsState = useEngineeringReports("all");
  const requirementsState = useRequirements();

  // Project Assignment (checklist #3): only show projects assigned to this engineer.
  const assignedProjects = useMemo(
    () => projectsState.projects.filter((p) => p.assignedEngineer === user?.name),
    [projectsState.projects, user?.name],
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