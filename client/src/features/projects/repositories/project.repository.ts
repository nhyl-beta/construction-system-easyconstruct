import { activeProjects } from "@/providers/mock-data";
import { Project } from "../types/project.types";
import { apiClient } from "@/services/api.client";

const USE_API = Boolean(import.meta.env.VITE_API_BASE);
const mockProjects: Project[] = (activeProjects as any) ?? [];

// Repository: uses mock data by default, but can switch to real HTTP API via VITE_USE_API=true
export const ProjectRepository = {
  async list(q?: string): Promise<Project[]> {
    if (USE_API) {
          return apiClient.get('/projects');
        }

    // mimic latency for mock provider
    await new Promise((r) => setTimeout(r, 120));
    if (!q) return mockProjects;
    const term = q.toLowerCase();
    return mockProjects.filter((p: Project) => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term));
  },

  async getById(code: string): Promise<Project | null> {
    if (USE_API) {
          try {
            return await apiClient.get(`/projects/${encodeURIComponent(code)}`);
          } catch (err: any) {
            throw err;
          }
        }

    await new Promise((r) => setTimeout(r, 80));
    return mockProjects.find((p: Project) => p.code === code) ?? null;
  },

  async create(payload: Partial<Project>): Promise<Project> {
    if (USE_API) {
          return apiClient.post('/projects', payload);
        }

    const newP: Project = {
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

  async patch(code: string, patch: Partial<Project>): Promise<Project | null> {
    if (USE_API) {
          return apiClient.patch(`/projects/${encodeURIComponent(code)}`, patch);
        }

    const idx = mockProjects.findIndex((p) => p.code === code);
    if (idx === -1) return null;
    mockProjects[idx] = { ...mockProjects[idx], ...patch } as Project;
    return mockProjects[idx];
  },

  async delete(code: string): Promise<Project | null> {
    if (USE_API) {
          return apiClient.del(`/projects/${encodeURIComponent(code)}`);
        }

    const idx = mockProjects.findIndex((p) => p.code === code);
    if (idx === -1) return null;
    const deleted = mockProjects.splice(idx, 1);
    return deleted[0];
  },
};
