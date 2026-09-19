// client/src/features/tasks/repositories/tasks.repository.ts — NEW
import { apiClient } from "@/services/api.client";

export interface TaskRecord {
  id: number;
  taskCode: string;
  projectCode: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  progress: number;
  dueDate: string | null;
  completionNote: string | null;
  completionFileUrl: string | null;
  completedAt: string | null;
}

/** Evidence captured when a task moves to Completed. */
export interface TaskCompletionInput {
  completionNote?: string;
  completionFileUrl?: string;
}

export interface CreateTaskInput {
  taskCode: string;
  projectCode: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  assignedToUserId?: number;
  assignedToName?: string;
}

export const tasksRepository = {
  listMine: (): Promise<{ data: TaskRecord[] }> => apiClient.get("/tasks"),
  // Same endpoint as listMine — for non-site-personnel roles the backend's
  // Site-Personnel-only scoping doesn't apply, so this genuinely returns
  // every task. Named separately so reviewer-facing pages read clearly.
  list: (): Promise<{ data: TaskRecord[] }> => apiClient.get("/tasks"),
  // POST /tasks is role-gated to project-manager and engineer on the backend.
  create: (input: CreateTaskInput): Promise<{ data: TaskRecord }> =>
    apiClient.post("/tasks", input),
  // `completion` is only meaningful on the transition to Completed, where
  // the backend requires a note (see server/src/validators/task-validators.ts).
  updateStatus: (
    id: number,
    status: string,
    completion: TaskCompletionInput = {},
  ): Promise<{ data: TaskRecord }> =>
    apiClient.patch(`/tasks/${id}/status`, { status, ...completion }),
};