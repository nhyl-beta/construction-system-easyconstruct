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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await ProjectService.queryProjects({ q: query });
      setProjects(data);
      setKpis(ProjectService.calcKpis(data));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [query]);

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
    reload: load,
  } as const;
}
