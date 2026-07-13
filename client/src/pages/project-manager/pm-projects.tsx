import React from "react";
import { ProjectsHeader } from "@/features/projects/components/ProjectsHeader";
import { ProjectsToolbar } from "@/features/projects/components/ProjectsToolbar";
import { ProjectsKpiStrip } from "@/features/projects/components/ProjectsKpiStrip";
import { ProjectsTable } from "@/features/projects/components/ProjectsTable";
import { ProjectsGrid } from "@/features/projects/components/ProjectsGrid";
import { ProjectEmptyState } from "@/features/projects/components/ProjectEmptyState";
import { ProjectLoadingState } from "@/features/projects/components/ProjectLoadingState";
import { useProjects } from "@/features/projects/hooks/useProjects";

export default function PMProjects() {
  const ctrl = useProjects();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <ProjectsHeader subtitle={`Portfolio of ${ctrl.kpis.total} active engagements`} />

      <ProjectsKpiStrip kpis={ctrl.kpis} />

      <ProjectsToolbar
        query={ctrl.query}
        setQuery={ctrl.setQuery}
        view={ctrl.view}
        setView={ctrl.setView}
      />

      {ctrl.loading ? (
        <ProjectLoadingState />
      ) : ctrl.projects.length === 0 ? (
        <ProjectEmptyState />
      ) : ctrl.view === "table" ? (
        <ProjectsTable projects={ctrl.projects} />
      ) : (
        <ProjectsGrid projects={ctrl.projects} />
      )}
    </div>
  );
}

PMProjects.displayName = "PMProjects";
