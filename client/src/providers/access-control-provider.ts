// src/providers/access-control-provider.ts
import type { AccessControlProvider } from "@refinedev/core";
import { ROLE_RESOURCE_ACCESS } from "@/config/role-resources";
import { MOCK_IDENTITY } from "@/config/mock-role";

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const role = MOCK_IDENTITY.role;
    const allowed = ROLE_RESOURCE_ACCESS[role] ?? [];

    // No resource means a page-level check — allow
    if (!resource) return { can: true };

    const canAccess = allowed.includes(resource);

    console.log(`[ACL] role=${role} resource=${resource} action=${action} → ${canAccess}`);

    return { can: canAccess };
  },
};