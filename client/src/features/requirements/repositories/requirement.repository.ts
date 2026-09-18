import { apiClient } from "@/services/api.client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type {
  CreateRequirementInput,
  Requirement,
  RequirementFilters,
} from "../types/requirements.types";

interface BackendRequirement {
  id: number;
  requirementId: string;
  title: string;
  project: string;
  category: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}

function normalizeRequirement(raw: BackendRequirement): Requirement {
  return {
    id: raw.requirementId,
    title: raw.title,
    project: raw.project,
    category: raw.category as Requirement["category"],
    description: raw.description,
    status: raw.status as Requirement["status"],
    createdBy: raw.createdBy,
    updatedAgo: formatRelativeTime(raw.updatedAt),
  };
}

async function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export const RequirementRepository = {
  async list(filters: RequirementFilters = {}): Promise<Requirement[]> {
    const params = new URLSearchParams();
    if (filters.project) params.set("project", filters.project);
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    const qs = params.toString();
    const raw = await unwrap<BackendRequirement[]>(
      apiClient.get(`/requirements${qs ? `?${qs}` : ""}`),
    );
    return raw.map(normalizeRequirement);
  },

  async create(payload: CreateRequirementInput): Promise<Requirement> {
    const raw = await unwrap<BackendRequirement>(apiClient.post("/requirements", payload));
    return normalizeRequirement(raw);
  },
};
