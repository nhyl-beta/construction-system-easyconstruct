import { useMemo } from "react";

import { useAuditLogs } from "@/features/audit-logs/hooks/useAuditLogs";
import { useRoles } from "@/features/roles/hooks/useRoles";
import { useUsers } from "@/features/users/hooks/use-users";

// Sensitive actions worth surfacing to whoever maintains the system. Kept in
// sync with admin-security.tsx, which filters the same audit trail.
const SENSITIVE_ACTIONS = new Set(["rejected", "deleted"]);

// IT Designer's dashboard answers "is the system healthy and who is in it",
// not "how are the projects going" — so it reads users, roles and the audit
// trail, and touches no project, finance or workflow data.
export const useITDesignerDashboardController = () => {
  const users = useUsers();
  const roles = useRoles();
  const auditLogs = useAuditLogs();

  const activeUserCount = useMemo(
    () => users.users.filter((u) => u.isActive).length,
    [users.users],
  );

  const deactivatedUserCount = useMemo(
    () => users.users.filter((u) => !u.isActive).length,
    [users.users],
  );

  const usersByRole = useMemo(() => {
    const counts = new Map<string, number>();
    for (const user of users.users) {
      counts.set(user.role, (counts.get(user.role) ?? 0) + 1);
    }
    // Every seeded role is listed, including the ones nobody holds yet —
    // an empty role is exactly the kind of thing this screen should show.
    return roles.roles
      .map((role) => ({
        name: role.name,
        label: role.label,
        count: counts.get(role.name) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [users.users, roles.roles]);

  // Accounts whose role string matches no row in the roles table can never
  // pass a requireRole() check — a real misconfiguration, not a cosmetic one.
  const orphanedRoleUsers = useMemo(() => {
    if (roles.loading || roles.roles.length === 0) return [];
    const known = new Set(roles.roles.map((role) => role.name));
    return users.users.filter((user) => !known.has(user.role));
  }, [users.users, roles.roles, roles.loading]);

  const sensitiveEvents = useMemo(
    () => auditLogs.logs.filter((log) => SENSITIVE_ACTIONS.has(log.action)),
    [auditLogs.logs],
  );

  const accountEvents = useMemo(
    () => auditLogs.logs.filter((log) => log.entityType === "user").slice(0, 8),
    [auditLogs.logs],
  );

  const recentActivity = useMemo(() => auditLogs.logs.slice(0, 8), [auditLogs.logs]);

  const loading = users.loading || roles.loading || auditLogs.loading;

  return {
    loading,

    usersLoading: users.loading,
    usersError: users.error,
    totalUserCount: users.users.length,
    activeUserCount,
    deactivatedUserCount,
    usersByRole,
    orphanedRoleUsers,

    rolesLoading: roles.loading,
    rolesError: roles.error,
    roleCount: roles.roles.length,

    auditLogsLoading: auditLogs.loading,
    auditLogsError: auditLogs.error,
    auditEventCount: auditLogs.logs.length,
    sensitiveEventCount: sensitiveEvents.length,
    accountEvents,
    recentActivity,
  } as const;
};

export default useITDesignerDashboardController;
