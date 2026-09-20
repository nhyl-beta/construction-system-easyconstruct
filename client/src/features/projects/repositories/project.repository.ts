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
  contractValue?: string | number | null;
  due: string;
  risk: string;
  location?: string | null;
  client?: string | null;
  currency?: string | null;
  workforce?: number | null;
  description?: string | null;
  siteLatitude?: string | number | null;
  siteLongitude?: string | number | null;
  geofenceRadiusM?: number | null;
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
    // Pre-currency-column rows come back null; they were all peso projects.
    currency: raw.currency ?? "PHP",
    location: raw.location ?? "Unknown",
    status: raw.status,
    statusTone: normalizeTone(raw.statusTone),
    progress: raw.progress ?? 0,
    budget: raw.budget ?? 0,
    contractValue: raw.contractValue == null ? null : Number(raw.contractValue),
    workforce: raw.workforce ?? 0,
    due: raw.due,
    risk: normalizeRisk(raw.risk),
    // numeric() columns come back from drizzle as strings.
    siteLatitude: raw.siteLatitude == null ? null : Number(raw.siteLatitude),
    siteLongitude: raw.siteLongitude == null ? null : Number(raw.siteLongitude),
    geofenceRadiusM: raw.geofenceRadiusM ?? null,
  };
}

// The backend's zod schema accepts title-case risk ("Low" | "Medium" | "High")
// and the UI works in lower-case. Normalization on the way in already happens
// in normalizeProject; this is the matching step on the way out, so a create
// from the New Project form doesn't fail validation.
function serializeProject(patch: Partial<Project>): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...patch };
  if (typeof patch.risk === "string") {
    payload.risk = patch.risk.charAt(0).toUpperCase() + patch.risk.slice(1).toLowerCase();
  }
  // id is a client-side concern; the backend rejects unknown/extra keys it
  // doesn't model on write.
  delete payload.id;
  delete payload.assignedEngineer;
  return payload;
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

  // Accepts either the numeric primary key (what the projects table and cards
  // link to) or the project code. Search only matches name/code, so a numeric
  // id has to go through the by-id endpoint or the detail page 404s.
  async getById(idOrCode: string): Promise<Project | null> {
    if (/^\d+$/.test(idOrCode)) {
      try {
        const raw = await unwrap<BackendProject | null>(apiClient.get(`/projects/${idOrCode}`));
        return raw ? normalizeProject(raw) : null;
      } catch {
        return null;
      }
    }
    const raw = await unwrap<BackendProject[]>(
      apiClient.get(`/projects?search=${encodeURIComponent(idOrCode)}`),
    );
    const match = raw.find((project) => project.code === idOrCode);
    return match ? normalizeProject(match) : null;
  },

  async create(payload: Partial<Project>): Promise<Project> {
    const raw = await unwrap<BackendProject>(apiClient.post("/projects", serializeProject(payload)));
    return normalizeProject(raw);
  },

  async patch(code: string, patch: Partial<Project>): Promise<Project | null> {
    const existing = await unwrap<BackendProject[]>(
      apiClient.get(`/projects?search=${encodeURIComponent(code)}`),
    );
    const target = existing.find((project) => project.code === code);
    if (!target?.id) return null;

    const raw = await unwrap<BackendProject>(apiClient.patch(`/projects/${target.id}`, serializeProject(patch)));
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
