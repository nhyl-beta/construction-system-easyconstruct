// src/features/requirements/repositories/requirement.repository.ts
import { apiClient } from "@/services/api.client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type {
  CreateRequirementInput,
  Requirement,
  RequirementFilters,
} from "../types/requirements.types";

const USE_API = Boolean(import.meta.env.VITE_API_BASE);

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

// Mirrors the seed rows on the backend, same convention as documents/engineering-reports.
const mockRequirements: Requirement[] = [
  {
    id: "REQ-101",
    title: "Curtain wall thermal performance",
    project: "WMT-204",
    category: "Specifications",
    description:
      "Curtain wall assembly must achieve a U-value ≤ 0.28 W/m²K across all glazed elevations.",
    status: "Approved",
    createdBy: "K. Okafor",
    updatedAgo: "3d ago",
  },
  {
    id: "REQ-102",
    title: "Rebar grade for transfer beams",
    project: "HLH-118",
    category: "Materials",
    description:
      "All transfer beam reinforcement must use Grade 60 rebar per the revised structural schedule.",
    status: "Under Review",
    createdBy: "L. Mendes",
    updatedAgo: "1d ago",
  },
  {
    id: "REQ-103",
    title: "Site access constraint — Zone C",
    project: "RCC-077",
    category: "Constraints",
    description:
      "Heavy equipment access to Zone C is restricted to 6am–10am due to adjacent school traffic.",
    status: "Draft",
    createdBy: "T. Nakamura",
    updatedAgo: "5h ago",
  },
];

// Unwraps the backend's { success, message, data } envelope.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

function matchesFilters(r: Requirement, filters: RequirementFilters): boolean {
  if (filters.project && filters.project !== "all" && r.project !== filters.project) return false;
  if (filters.category && filters.category !== "all" && r.category !== filters.category)
    return false;
  if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
  if (filters.search && !r.title.toLowerCase().includes(filters.search.toLowerCase()))
    return false;
  return true;
}

export const RequirementRepository = {
  async list(filters: RequirementFilters = {}): Promise<Requirement[]> {
    if (USE_API) {
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
    }

    await new Promise((r) => setTimeout(r, 120));
    return mockRequirements.filter((r) => matchesFilters(r, filters));
  },

  async create(payload: CreateRequirementInput): Promise<Requirement> {
    if (USE_API) {
      const raw = await unwrap<BackendRequirement>(apiClient.post("/requirements", payload));
      return normalizeRequirement(raw);
    }

    const newRequirement: Requirement = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      status: "Draft",
      updatedAgo: "just now",
      ...payload,
    };
    mockRequirements.unshift(newRequirement);
    return newRequirement;
  },
};