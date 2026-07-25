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
import { useState } from "react";

export default function PMProjects() {
  const ctrl = useProjects();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <ProjectsHeader
        subtitle={`Portfolio of ${ctrl.kpis.total} active engagements`}
        actions={
          <Button onClick={() => setShowModal(true)} className="rounded-xl">
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
