// client/src/features/account-recovery/repositories/account-recovery.repository.ts — NEW
import { apiClient } from "@/services/api.client";

export interface OwnerRecoveryEmail {
  to: string;
  targetUserId: number;
  targetName: string;
  targetEmail: string;
  resetUrl: string;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

export const AccountRecoveryRepository = {
  async initiate(targetUserId: number): Promise<OwnerRecoveryEmail> {
    return unwrap<OwnerRecoveryEmail>(
      apiClient.post("/auth/owner-recovery/initiate", { targetUserId }),
    );
  },

  async inbox(): Promise<OwnerRecoveryEmail | null> {
    return unwrap<OwnerRecoveryEmail | null>(apiClient.get("/auth/owner-recovery/inbox"));
  },
};
