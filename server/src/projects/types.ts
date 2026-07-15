export interface ProjectRecord {
  id: number;
  name: string;
  code: string;
  pm: string;
  status: string;
  statusTone: string;
  progress: number;
  budget: number;
  due: string;
  risk: string;
  location: string | null;
  client: string | null;
  workforce: number | null;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateProjectInput {
  name: string;
  code: string;
  pm: string;
  status?: string;
  statusTone?: string;
  progress?: number;
  budget?: number;
  due: string;
  risk?: string;
  location?: string;
  client?: string;
  workforce?: number;
  description?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export interface ProjectFilters {
  status?: string;
  risk?: string;
  search?: string;
}
