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
}

export const tasksRepository = {
  listMine: (): Promise<{ data: TaskRecord[] }> => apiClient.get("/tasks"),
  // Same endpoint as listMine — for non-site-personnel roles the backend's
  // Site-Personnel-only scoping doesn't apply, so this genuinely returns
  // every task. Named separately so reviewer-facing pages read clearly.
  list: (): Promise<{ data: TaskRecord[] }> => apiClient.get("/tasks"),
  updateStatus: (id: number, status: string): Promise<{ data: TaskRecord }> =>
    apiClient.patch(`/tasks/${id}/status`, { status }),
};