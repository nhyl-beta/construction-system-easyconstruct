// client/src/features/tasks/hooks/use-my-tasks.ts — NEW
import { useCallback, useEffect, useState } from "react";
import {
  tasksRepository,
  type CreateTaskInput,
  type TaskRecord,
} from "../repositories/task.repository";

const NEXT_STATUS: Record<string, string | null> = {
  Pending: "In Progress",
  "In Progress": "Completed",
  Completed: null,
};

export function useMyTasks() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tasksRepository.listMine();
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

  const advance = useCallback(
    async (task: TaskRecord) => {
      const next = NEXT_STATUS[task.status];
      if (!next) return;
      setUpdatingId(task.id);
      try {
        await tasksRepository.updateStatus(task.id, next);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update task");
      } finally {
        setUpdatingId(null);
      }
    },
    [refresh],
  );

  const [creating, setCreating] = useState(false);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      setCreating(true);
      setError(null);
      try {
        await tasksRepository.create(input);
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create task");
        return false;
      } finally {
        setCreating(false);
      }
    },
    [refresh],
  );

  const counts = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "Pending").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
    overdue: tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completed",
    ).length,
  };

  return { tasks, counts, loading, error, updatingId, advance, refresh, createTask, creating };
}