/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/projects/repositories/project.repository.ts

import { activeProjects, type Project as MockProject } from "@/providers/mock-data";
import { Project, RiskLevel, StatusTone } from "../types/project.types";
import { apiClient } from "@/services/api.client";

const USE_API = Boolean(import.meta.env.VITE_API_BASE);

// ─────────────────────────────────────────────────────────────────────────────
// Backend → frontend normalization
// The backend stores status/risk/statusTone as free-text varchar columns.
// This feature's Project type expects strict literal unions, so we normalize
// here at the repository boundary.
// ─────────────────────────────────────────────────────────────────────────────

interface BackendProject {
  id?: number;
  name: string;
  code: string;
  pm?: string;
  assignedEngineer?: string | null;
  status: string;
  statusTone: string;
  progress: number;
  budget: number;
  due: string;
  risk: string;
  location?: string | null;
  client?: string | null;
  workforce?: number | null;
  description?: string | null;
}

const VALID_TONES: StatusTone[] = [
  "success",
  "warning",
  "destructive",
  "neutral",
];

const VALID_RISKS: RiskLevel[] = ["low", "medium", "high"];

function normalizeTone(tone: string | undefined): StatusTone {
  const lower = (tone ?? "").toLowerCase();

  if (VALID_TONES.includes(lower as StatusTone)) {
    return lower as StatusTone;
  }

  return "neutral";
}

function normalizeRisk(risk: string | undefined): RiskLevel {
  const lower = (risk ?? "").toLowerCase();

  return VALID_RISKS.includes(lower as RiskLevel)
    ? (lower as RiskLevel)
    : "low";
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock project normalization
// ─────────────────────────────────────────────────────────────────────────────

function normalizeMockProject(raw: MockProject): Project {
  return {
    id: raw.code,
    code: raw.code,
    name: raw.name,
    pm: raw.pm,
    assignedEngineer: undefined,
    client: "Unknown",
    location: "Unknown",
    status: raw.status,
    statusTone: normalizeTone(raw.statusTone),
    progress: raw.progress,
    budget: raw.budget,
    workforce: 0,
    due: raw.due,
    risk: normalizeRisk(raw.risk),
  };
}

const mockProjects: Project[] = (activeProjects ?? []).map(
  normalizeMockProject,
);

// ─────────────────────────────────────────────────────────────────────────────
// Backend project normalization
// ─────────────────────────────────────────────────────────────────────────────

function normalizeProject(raw: BackendProject): Project {
  return {
    // Backend has a numeric ID while the frontend expects a string ID.
    // Fall back to project code if the backend does not return an ID.
    id: raw.id?.toString() ?? raw.code,

    code: raw.code,
    name: raw.name,
    pm: raw.pm ?? "Unassigned",
    assignedEngineer: raw.assignedEngineer ?? undefined,
    client: raw.client ?? "Unknown",
    location: raw.location ?? "Unknown",
    status: raw.status,
    statusTone: normalizeTone(raw.statusTone),
    progress: raw.progress ?? 0,
    budget: raw.budget ?? 0,
    workforce: raw.workforce ?? 0,
    due: raw.due,
    risk: normalizeRisk(raw.risk),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API response helper
// ─────────────────────────────────────────────────────────────────────────────

// Unwraps the backend's { success, message, data } envelope.
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;

  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export const ProjectRepository = {
  async list(q?: string): Promise<Project[]> {
    if (USE_API) {
      const path = q
        ? `/projects?search=${encodeURIComponent(q)}`
        : "/projects";

      const raw = await unwrap<BackendProject[]>(apiClient.get(path));

      return raw.map(normalizeProject);
    }

    // Mimic latency for mock provider.
    await new Promise((r) => setTimeout(r, 120));

    if (!q) {
      return mockProjects;
    }

    const term = q.toLowerCase();

    return mockProjects.filter(
      (p: Project) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term),
    );
  },

  async getById(code: string): Promise<Project | null> {
    if (USE_API) {
      // Backend routes by numeric serial ID, not project code.
      // Reuse the search filter and find the exact code client-side.
      const raw = await unwrap<BackendProject[]>(
        apiClient.get(`/projects?search=${encodeURIComponent(code)}`),
      );

      const match = raw.find((p) => p.code === code);

      return match ? normalizeProject(match) : null;
    }

    await new Promise((r) => setTimeout(r, 80));

    return (
      mockProjects.find((p: Project) => p.code === code) ?? null
    );
  },

  async create(payload: Partial<Project>): Promise<Project> {
    if (USE_API) {
      const raw = await unwrap<BackendProject>(
        apiClient.post("/projects", payload),
      );

      return normalizeProject(raw);
    }

    // Generate the code once so it can also be used as the fallback ID.
    const code = payload.code ?? `EC-${Date.now()}`;

    const newP: Project = {
      id: payload.id?.toString() ?? code,
      code,
      name: payload.name ?? "New Project",
      pm: payload.pm ?? "Unassigned",
      client: payload.client ?? "Unknown",
      location: payload.location ?? "Unknown",
      status: payload.status ?? "On track",
      statusTone: (payload as any).statusTone ?? "neutral",
      progress: payload.progress ?? 0,
      budget: payload.budget ?? 0,
      workforce: payload.workforce ?? 0,
      due: payload.due ?? "",
      risk: (payload as any).risk ?? "low",
    };

    // In real repo would persist.
    return newP;
  },

  async patch(
    code: string,
    patch: Partial<Project>,
  ): Promise<Project | null> {
    if (USE_API) {
      // Look up the numeric backend ID first.
      const existing = await unwrap<BackendProject[]>(
        apiClient.get(`/projects?search=${encodeURIComponent(code)}`),
      );

      const target = existing.find((p) => p.code === code);

      if (!target?.id) {
        return null;
      }

      const raw = await unwrap<BackendProject>(
        apiClient.patch(`/projects/${target.id}`, patch),
      );

      return normalizeProject(raw);
    }

    const idx = mockProjects.findIndex((p) => p.code === code);

    if (idx === -1) {
      return null;
    }

    mockProjects[idx] = {
      ...mockProjects[idx],
      ...patch,
    } as Project;

    return mockProjects[idx];
  },

  async delete(code: string): Promise<Project | null> {
    if (USE_API) {
      const existing = await unwrap<BackendProject[]>(
        apiClient.get(`/projects?search=${encodeURIComponent(code)}`),
      );

      const target = existing.find((p) => p.code === code);

      if (!target?.id) {
        return null;
      }

      const raw = await unwrap<BackendProject>(
        apiClient.del(`/projects/${target.id}`),
      );

      return normalizeProject(raw);
    }

    const idx = mockProjects.findIndex((p) => p.code === code);

    if (idx === -1) {
      return null;
    }

    const deleted = mockProjects.splice(idx, 1);

    return deleted[0];
  },
};
