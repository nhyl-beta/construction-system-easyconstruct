import { useEffect, useMemo, useState } from "react";
import type { Design } from "../types/design.types";

interface ProjectSummary {
  id: number;
  name: string;
  code: string;
  status: string;
  risk: string;
  progress: number;
  due: string;
  designCount: number;
}

export const useArchitectProjectsController = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/designs").then((r) => r.json()),
    ])
      .then(([projJson, designJson]) => {
        setProjects(projJson.data ?? []);
        setDesigns(designJson.data ?? []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const scopedProjects: ProjectSummary[] = useMemo(() => {
    const codesWithDesigns = new Set(designs.map((d) => d.projectCode));
    return projects
      .filter((p) => codesWithDesigns.has(p.code))
      .map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        risk: p.risk,
        progress: p.progress,
        due: p.due,
        designCount: designs.filter((d) => d.projectCode === p.code).length,
      }))
      .filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.code.toLowerCase().includes(query.toLowerCase()));
  }, [projects, designs, query]);

  return { projects: scopedProjects, loading, query, setQuery };
};