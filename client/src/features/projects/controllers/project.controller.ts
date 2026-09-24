import { useEffect, useState, useCallback } from "react";
import { Project } from "../types/project.types";
import { ProjectService } from "../services/project.service";

// Controller hook: orchestrates service calls, state, and exposes actions for views.
export function useProjectsController(initialQuery = "") {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<"table" | "grid">("table");
  const [kpis, setKpis] = useState({ total: 0, onTrack: 0, atRisk: 0, delayed: 0 });
  // Archived is the lifecycle's terminal, no-further-action phase (C12) — an
  // archived project cluttering every list by default is exactly what
  // "archive" was supposed to get it out of.
  const [showArchived, setShowArchived] = useState(false);
  // K2: Owner's portfolio wants a quick way to see only wrapped-up projects.
  const [completedOnly, setCompletedOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await ProjectService.queryProjects({ q: query });
      let visible = showArchived ? data : data.filter((p) => p.status !== "Archived");
      if (completedOnly) visible = visible.filter((p) => p.status === "Completed");
      setProjects(visible);
      setKpis(ProjectService.calcKpis(visible));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [query, showArchived, completedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    projects,
    loading,
    error,
    query,
    setQuery,
    view,
    setView,
    kpis,
    showArchived,
    setShowArchived,
    completedOnly,
    setCompletedOnly,
    reload: load,
  } as const;
}
