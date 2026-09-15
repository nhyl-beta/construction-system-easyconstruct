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
  assignedToUserId: number | null;
  assignedToName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateTaskInput {
  taskCode: string;
  projectCode: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  progress?: number;
  dueDate?: string;
  assignedToUserId?: number;
  assignedToName?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}

export interface TaskFilters {
  projectCode?: string;
  status?: string;
  assignedToUserId?: number;
}