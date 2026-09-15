export const REQUIREMENT_CATEGORIES = [
  "Objectives",
  "Materials",
  "Constraints",
  "Specifications",
  "Other",
] as const;

export const REQUIREMENT_STATUSES = [
  "Draft",
  "Under Review",
  "Approved",
  "Rejected",
] as const;

export interface RequirementRecord {
  id: number;
  requirementId: string;
  title: string;
  project: string;
  category: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateRequirementInput {
  requirementId: string;
  title: string;
  project: string;
  category: string;
  description: string;
  status?: string;
  createdBy: string;
}

export interface UpdateRequirementInput extends Partial<CreateRequirementInput> {}

export interface RequirementFilters {
  project?: string;
  category?: string;
  status?: string;
  search?: string;
}