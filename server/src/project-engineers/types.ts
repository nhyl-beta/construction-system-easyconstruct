export interface ProjectEngineerRecord {
  id: number;
  projectCode: string;
  userId: number;
  userName: string;
  addedBy: string;
  createdAt: Date | null;
}

export interface CreateProjectEngineerInput {
  projectCode: string;
  userId: number;
  userName: string;
  addedBy: string;
}

export interface ProjectEngineerFilters {
  projectCode?: string;
}
