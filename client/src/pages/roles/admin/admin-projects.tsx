import { Button } from "@/components/ui/button";

import { ProjectEmptyState } from "@/features/projects/components/ProjectEmptyState";
import { ProjectLoadingState } from "@/features/projects/components/ProjectLoadingState";
import { ProjectsGrid } from "@/features/projects/components/ProjectsGrid";
import { ProjectsHeader } from "@/features/projects/components/ProjectsHeader";
import { ProjectsKpiStrip } from "@/features/projects/components/ProjectsKpiStrip";
import { ProjectsTable } from "@/features/projects/components/ProjectsTable";
import { ProjectsToolbar } from "@/features/projects/components/ProjectsToolbar";
import { useProjects } from "@/features/projects/hooks/useProjects";

import { Plus } from "lucide-react";
import { useNavigate } from "react-router";

export default function AdminProjectsPage() {
  const ctrl = useProjects();
  const navigate = useNavigate();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <ProjectsHeader
        subtitle={`Organization-wide oversight of ${ctrl.kpis.total} project${ctrl.kpis.total === 1 ? "" : "s"}`}
        actions={
          <Button onClick={() => navigate("/projects/new")} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      <ProjectsKpiStrip kpis={ctrl.kpis} />

      <ProjectsToolbar
        query={ctrl.query}
        setQuery={ctrl.setQuery}
        view={ctrl.view}
        setView={ctrl.setView}
      />

      {ctrl.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Couldn't load projects. {ctrl.error.message}
        </div>
      ) : ctrl.loading ? (
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

AdminProjectsPage.displayName = "AdminProjectsPage";
