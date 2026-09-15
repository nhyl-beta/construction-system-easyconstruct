// src/features/projects/repositories/project.repository.ts
import { activeProjects } from "@/providers/mock-data";
import { Project, RiskLevel, StatusTone } from "../types/project.types";
import { apiClient } from "@/services/api.client";

const USE_API = import.meta.env.VITE_USE_MOCK_DATA !== "true";
const mockProjects: Project[] = (activeProjects as any) ?? [];

// ─────────────────────────────────────────────────────────────────────────────
// Backend → frontend normalization
// The backend stores status/risk/statusTone as free-text varchar columns.
// This feature's Project type expects strict literal unions, so we normalize
// here at the repository boundary — the one place that knows about "the
// outside world's" data shape. Anything unexpected fails safe to a neutral
// default rather than breaking STATUS_TONE_CLASS / RISK_CLASS lookups.
// ─────────────────────────────────────────────────────────────────────────────

interface BackendProject {
  id: number;
  name: string;
  code: string;
  pm?: string;
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

type ProjectPayload = Partial<Omit<Project, "risk">> & { risk?: string };

const VALID_TONES: StatusTone[] = ["success", "warning", "destructive", "neutral"];
const VALID_RISKS: RiskLevel[] = ["low", "medium", "high"];

function normalizeTone(tone: string | undefined): StatusTone {
  const lower = (tone ?? "").toLowerCase();
  if (VALID_TONES.includes(lower as StatusTone)) return lower as StatusTone;
  // "info" and "muted" (used in mock-data/backend seed) don't have a direct
  // equivalent in this feature's stricter tone set — fall back to neutral.
  return "neutral";
}

function normalizeRisk(risk: string | undefined): RiskLevel {
  const lower = (risk ?? "").toLowerCase();
  return VALID_RISKS.includes(lower as RiskLevel) ? (lower as RiskLevel) : "low";
}

function normalizeProject(raw: BackendProject): Project {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    pm: raw.pm,
    client: raw.client ?? "Unknown",
    location: raw.location ?? "Unknown",
    status: raw.status,
    statusTone: normalizeTone(raw.statusTone),
    progress: raw.progress ?? 0,
    budget: raw.budget ?? 0,
    workforce: raw.workforce ?? 0,
    due: raw.due,
    risk: normalizeRisk(raw.risk),
    description: raw.description,
  };
}

// Unwraps the backend's { success, message, data } envelope.
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

// Repository: uses mock data by default, but switches to the real HTTP API
// when VITE_API_BASE is set.
export const ProjectRepository = {
  async list(q?: string): Promise<Project[]> {
    if (USE_API) {
      const path = q ? `/projects?search=${encodeURIComponent(q)}` : "/projects";
      const raw = await unwrap<BackendProject[]>(apiClient.get(path));
      return raw.map(normalizeProject);
    }

    // mimic latency for mock provider
    await new Promise((r) => setTimeout(r, 120));
    if (!q) return mockProjects;
    const term = q.toLowerCase();
    return mockProjects.filter(
      (p: Project) => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term),
    );
  },

  async getById(identifier: string): Promise<Project | null> {
    if (USE_API) {
      if (/^\d+$/.test(identifier)) {
        const raw = await unwrap<BackendProject>(
          apiClient.get(`/projects/${encodeURIComponent(identifier)}`),
        );
        return raw ? normalizeProject(raw) : null;
      }
      const raw = await unwrap<BackendProject[]>(
        apiClient.get(`/projects?search=${encodeURIComponent(identifier)}`),
      );
      const match = raw.find((project) => project.code === identifier);
      return match ? normalizeProject(match) : null;
    }

    await new Promise((r) => setTimeout(r, 80));
    return mockProjects.find((p: Project) => p.code === identifier) ?? null;
  },

  async create(payload: ProjectPayload): Promise<Project> {
    if (USE_API) {
      const raw = await unwrap<BackendProject>(apiClient.post("/projects", payload));
      return normalizeProject(raw);
    }

    const newP: Project = {
      id: Date.now(),
      code: payload.code ?? `EC-${Date.now()}`,
      name: payload.name ?? "New Project",
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
    // in real repo would persist
    return newP;
  },

  async patch(code: string, patch: ProjectPayload): Promise<Project | null> {
    if (USE_API) {
      const target = await ProjectRepository.getById(code);
      if (!target?.id) return null;
      const raw = await unwrap<BackendProject>(apiClient.patch(`/projects/${target.id}`, patch));
      return normalizeProject(raw);
    }

    const idx = mockProjects.findIndex((p) => p.code === code);
    if (idx === -1) return null;
    mockProjects[idx] = { ...mockProjects[idx], ...patch } as Project;
    return mockProjects[idx];
  },

  async delete(code: string): Promise<Project | null> {
    if (USE_API) {
      const target = await ProjectRepository.getById(code);
      if (!target?.id) return null;
      const raw = await unwrap<BackendProject>(apiClient.del(`/projects/${target.id}`));
      return normalizeProject(raw);
    }

    const idx = mockProjects.findIndex((p) => p.code === code);
    if (idx === -1) return null;
    const deleted = mockProjects.splice(idx, 1);
    return deleted[0];
  },
};