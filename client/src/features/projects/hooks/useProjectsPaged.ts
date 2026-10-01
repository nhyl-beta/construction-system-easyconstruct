import { useCallback, useEffect, useState } from "react";
import { ProjectRepository, type ProjectPage } from "../repositories/project.repository";
import { ProjectService } from "../services/project.service";
import type { ProjectsKpi } from "../types/project.types";

export const PAGE_SIZES = [10, 20, 50] as const;

export interface ProjectFilterState {
  projectType: string;
  status: string;
  risk: string;
}

const NO_FILTERS: ProjectFilterState = { projectType: "all", status: "all", risk: "all" };

/**
 * The All projects table: server-side search, filters and pagination.
 *
 * The KPI strip is computed from the whole (scoped) portfolio rather than from
 * the current page, so paging through the table doesn't change the headline
 * numbers.
 */
export function useProjectsPaged() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ProjectFilterState>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [view, setView] = useState<"table" | "grid">("table");

  const [data, setData] = useState<ProjectPage | null>(null);
  const [kpis, setKpis] = useState<ProjectsKpi>({ total: 0, onTrack: 0, atRisk: 0, delayed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounce typing so every keystroke isn't a request, and go back to page 1
  // whenever what is being looked at changes.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await ProjectRepository.listPage({
          page,
          pageSize,
          search,
          ...filters,
          excludeArchived: filters.status !== "Archived",
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load projects"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    ProjectService.fetchAll()
      .then((all) => setKpis(ProjectService.calcKpis(all.filter((p) => p.status !== "Archived"))))
      .catch(() => undefined);
  }, []);

  const setFilter = (key: keyof ProjectFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(NO_FILTERS);
    setQuery("");
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters =
    query.trim() !== "" || Object.values(filters).some((v) => v !== "all");

  return {
    projects: data?.items ?? [],
    total: data?.total ?? 0,
    pages: data?.pages ?? 1,
    page: data?.page ?? page,
    pageSize,
    setPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    query,
    setQuery,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    view,
    setView,
    kpis,
    loading,
    error,
  } as const;
}
