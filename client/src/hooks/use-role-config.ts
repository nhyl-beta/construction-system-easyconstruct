// src/hooks/use-role-config.ts
import { MOCK_IDENTITY, type AppIdentity } from "../config/mock-role";
import { DEFAULT_ROLE_CONFIG, ROLE_CONFIGS } from "../config/role-tab";
import { useActiveAuthProvider, useGetIdentity } from "@refinedev/core";

export function useRoleConfig() {
  const authProvider = useActiveAuthProvider();

  // If no auth provider yet, use mock identity
  const hasAuth = !!authProvider?.getIdentity;

  const { data: liveIdentity } = useGetIdentity<AppIdentity>();

  // Live identity when auth exists, mock when it doesn't
  const identity: AppIdentity = hasAuth
    ? liveIdentity ?? MOCK_IDENTITY
    : MOCK_IDENTITY;

  const config = ROLE_CONFIGS[identity.role] ?? DEFAULT_ROLE_CONFIG;

  return { identity, config };
}
