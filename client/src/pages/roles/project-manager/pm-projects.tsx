import { Button } from "@/components/ui/button";

import { ProjectEmptyState } from "@/features/projects/components/ProjectEmptyState";
import { ProjectLoadingState } from "@/features/projects/components/ProjectLoadingState";
import { ProjectsGrid } from "@/features/projects/components/ProjectsGrid";
import { ProjectsHeader } from "@/features/projects/components/ProjectsHeader";
import { ProjectsKpiStrip } from "@/features/projects/components/ProjectsKpiStrip";
import { ProjectsTable } from "@/features/projects/components/ProjectsTable";
import { ProjectsToolbar } from "@/features/projects/components/ProjectsToolbar";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useAuth } from "@/auth/auth-context";

import { Plus } from "lucide-react";
import { useNavigate } from "react-router";

// Mirrors the route guard on POST /api/projects
// (server/src/projects/routes.ts: requireRole("project-manager", "admin",
// "it-designer")). "/projects" is shared by every role whose nav tab points
// here — Architect and Engineer included — and the button used to render
// unconditionally, so those roles could open the creation form only to have
// the backend reject it.
const CAN_CREATE_PROJECT = ["project-manager", "admin", "it-designer"];

export default function PMProjects() {
  const ctrl = useProjects();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = CAN_CREATE_PROJECT.includes(user?.role ?? "");

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <ProjectsHeader
        subtitle={`Portfolio of ${ctrl.kpis.total} active engagements`}
        actions={
          canCreate ? (
            <Button onClick={() => navigate("/projects/new")} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          ) : undefined
        }
      />

      <ProjectsKpiStrip kpis={ctrl.kpis} />

      <ProjectsToolbar
        query={ctrl.query}
        setQuery={ctrl.setQuery}
        view={ctrl.view}
        setView={ctrl.setView}
        showCreate={canCreate}
        showArchived={ctrl.showArchived}
        onToggleArchived={ctrl.setShowArchived}
      />

      {ctrl.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Couldn’t load projects. {ctrl.error.message}
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

PMProjects.displayName = "PMProjects";
