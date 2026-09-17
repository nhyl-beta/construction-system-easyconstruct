// client/src/features/tasks/hooks/use-project-task-progress.ts — NEW
import { useCallback, useEffect, useMemo, useState } from "react";
import { tasksRepository, type TaskRecord } from "../repositories/task.repository";

export interface ProjectTaskProgress {
  projectCode: string;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percentComplete: number;
}

// Client-side rollup of tasks grouped by project — deliberately does not
// write back to `projects.progress` (a separate, manually-set column), so
// this can't destabilize existing project data; it's a read-only view of
// what Site Personnel have actually completed.
export function useProjectTaskProgress() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tasksRepository.list();
      setTasks(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byProject = useMemo<ProjectTaskProgress[]>(() => {
    const groups = new Map<string, TaskRecord[]>();
    for (const t of tasks) {
      const list = groups.get(t.projectCode) ?? [];
      list.push(t);
      groups.set(t.projectCode, list);
    }
    return Array.from(groups.entries())
      .map(([projectCode, items]) => {
        const completed = items.filter((t) => t.status === "Completed").length;
        const inProgress = items.filter((t) => t.status === "In Progress").length;
        const pending = items.filter((t) => t.status === "Pending").length;
        const percentComplete = items.length
          ? Math.round(items.reduce((sum, t) => sum + t.progress, 0) / items.length)
          : 0;
        return { projectCode, total: items.length, completed, inProgress, pending, percentComplete };
      })
      .sort((a, b) => a.projectCode.localeCompare(b.projectCode));
  }, [tasks]);

  return { byProject, loading, error, refresh };
}
