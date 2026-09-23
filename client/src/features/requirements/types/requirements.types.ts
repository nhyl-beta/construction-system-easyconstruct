export const REQUIREMENT_CATEGORIES = [
  "Objectives",
  "Materials",
  "Constraints",
  "Specifications",
  "Other",
] as const;
export type RequirementCategory = (typeof REQUIREMENT_CATEGORIES)[number];

export const REQUIREMENT_STATUSES = ["Draft", "Under Review", "Approved", "Rejected"] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

export interface Requirement {
  id: string; // human-readable code, e.g. "REQ-101"
  /** Numeric primary key — what PATCH /requirements/:id actually takes. */
  dbId: number;
  title: string;
  project: string;
  category: RequirementCategory;
  description: string;
  status: RequirementStatus;
  createdBy: string;
  updatedAgo: string;
}

export interface RequirementFilters {
  project?: string;
  category?: string;
  status?: string;
  search?: string;
}

export interface CreateRequirementInput {
  title: string;
  project: string;
  category: RequirementCategory;
  description: string;
  createdBy: string;
}