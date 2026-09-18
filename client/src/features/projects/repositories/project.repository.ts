import { Project, RiskLevel, StatusTone } from "../types/project.types";
import { apiClient } from "@/services/api.client";

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

const VALID_TONES: StatusTone[] = ["success", "warning", "destructive", "neutral"];
const VALID_RISKS: RiskLevel[] = ["low", "medium", "high"];

function normalizeTone(tone: string | undefined): StatusTone {
  const lower = (tone ?? "").toLowerCase();
  return VALID_TONES.includes(lower as StatusTone) ? (lower as StatusTone) : "neutral";
}

function normalizeRisk(risk: string | undefined): RiskLevel {
  const lower = (risk ?? "").toLowerCase();
  return VALID_RISKS.includes(lower as RiskLevel) ? (lower as RiskLevel) : "low";
}

function normalizeProject(raw: BackendProject): Project {
  return {
    id: raw.id != null ? String(raw.id) : raw.code,
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

async function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export const ProjectRepository = {
  async list(q?: string): Promise<Project[]> {
    const path = q ? `/projects?search=${encodeURIComponent(q)}` : "/projects";
    const raw = await unwrap<BackendProject[]>(apiClient.get(path));
    return raw.map(normalizeProject);
  },

  async getById(code: string): Promise<Project | null> {
    const raw = await unwrap<BackendProject[]>(
      apiClient.get(`/projects?search=${encodeURIComponent(code)}`),
    );
    const match = raw.find((project) => project.code === code);
    return match ? normalizeProject(match) : null;
  },

  async create(payload: Partial<Project>): Promise<Project> {
    const raw = await unwrap<BackendProject>(apiClient.post("/projects", payload));
    return normalizeProject(raw);
  },

  async patch(code: string, patch: Partial<Project>): Promise<Project | null> {
    const existing = await unwrap<BackendProject[]>(
      apiClient.get(`/projects?search=${encodeURIComponent(code)}`),
    );
    const target = existing.find((project) => project.code === code);
    if (!target?.id) return null;

    const raw = await unwrap<BackendProject>(apiClient.patch(`/projects/${target.id}`, patch));
    return normalizeProject(raw);
  },

  async delete(code: string): Promise<Project | null> {
    const existing = await unwrap<BackendProject[]>(
      apiClient.get(`/projects?search=${encodeURIComponent(code)}`),
    );
    const target = existing.find((project) => project.code === code);
    if (!target?.id) return null;

    const raw = await unwrap<BackendProject>(apiClient.del(`/projects/${target.id}`));
    return normalizeProject(raw);
  },
};
