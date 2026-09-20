export interface ProjectRecord {
  id: number;
  name: string;
  code: string;
  pm: string;
  assignedEngineer: string | null;
  status: string;
  statusTone: string;
  progress: number;
  budget: number;
  contractValue: string | null;
  due: string;
  risk: string;
  location: string | null;
  client: string | null;
  currency: string;
  workforce: number | null;
  description: string | null;
  siteLatitude: string | null;
  siteLongitude: string | null;
  geofenceRadiusM: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateProjectInput {
  name: string;
  code: string;
  pm: string;
  assignedEngineer?: string;
  status?: string;
  statusTone?: string;
  progress?: number;
  budget?: number;
  contractValue?: number | string | null;
  due: string;
  risk?: string;
  location?: string;
  client?: string;
  currency?: string;
  workforce?: number;
  description?: string;
  siteLatitude?: number | string | null;
  siteLongitude?: number | string | null;
  geofenceRadiusM?: number | null;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export interface ProjectFilters {
  status?: string;
  risk?: string;
  search?: string;
}