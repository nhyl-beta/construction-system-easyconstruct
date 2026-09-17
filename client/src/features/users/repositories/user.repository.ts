import { apiClient } from "@/services/api.client";

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

export const UserRepository = {
  async listByRole(role: string): Promise<PublicUser[]> {
    return unwrap<PublicUser[]>(apiClient.get(`/users?role=${encodeURIComponent(role)}`));
  },
};
