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
  previousStatus: string | null;
  holdReason: string | null;
  completedAt: Date | null;
  archivedAt: Date | null;
  pmUserId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateProjectInput {
  name: string;
  code: string;
  pm: string;
  assignedEngineer?: string;
  // Accepted, but projects/service.ts create() always overwrites these to
  // Proposal/neutral/0 — see project-validator.ts.
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

// Deliberately NOT `Partial<CreateProjectInput>` — status/statusTone/progress
// are lifecycle-owned (see lifecycle/service.ts) and must not be reachable
// through the general project PATCH at all, not even optionally.
export type UpdateProjectInput = Partial<
  Omit<CreateProjectInput, "status" | "statusTone" | "progress">
>;

export interface ProjectFilters {
  status?: string;
  risk?: string;
  search?: string;
}