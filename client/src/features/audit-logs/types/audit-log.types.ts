export interface AuditLog {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  summary: string | null;
  // K3: nullable — many entries (auth, user/role/template admin) have no
  // single project to attach to.
  projectCode: string | null;
  createdAt: string | null;
}

export interface AuditLogsQuery {
  entityType?: string;
  entityId?: string;
  projectCode?: string;
}

/** GET /api/audit-logs/security-overview */
export interface SecurityOverview {
  /** One entry per person with a sign-in inside the token lifetime. */
  sessions: AuditLog[];
  failedLogins: AuditLog[];
}
