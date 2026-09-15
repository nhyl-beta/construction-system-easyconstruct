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
  updateStatus: (id: number, status: string): Promise<{ data: TaskRecord }> =>
    apiClient.patch(`/tasks/${id}/status`, { status }),
};