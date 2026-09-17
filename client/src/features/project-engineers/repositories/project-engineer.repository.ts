import { apiClient } from "@/services/api.client";

export interface ProjectEngineer {
  id: number;
  projectCode: string;
  userId: number;
  userName: string;
  addedBy: string;
  createdAt: string | null;
}

export interface CreateProjectEngineerInput {
  projectCode: string;
  userId: number;
  userName: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

export const ProjectEngineerRepository = {
  async listForProject(projectCode: string): Promise<ProjectEngineer[]> {
    return unwrap<ProjectEngineer[]>(
      apiClient.get(`/project-engineers?projectCode=${encodeURIComponent(projectCode)}`),
    );
  },

  async create(input: CreateProjectEngineerInput): Promise<ProjectEngineer> {
    return unwrap<ProjectEngineer>(apiClient.post("/project-engineers", input));
  },

  async remove(id: number): Promise<ProjectEngineer> {
    return unwrap<ProjectEngineer>(apiClient.del(`/project-engineers/${id}`));
  },
};
