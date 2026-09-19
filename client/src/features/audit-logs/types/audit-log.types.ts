export interface AuditLog {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  summary: string | null;
  createdAt: string | null;
}

export interface AuditLogsQuery {
  entityType?: string;
  entityId?: string;
}

/** GET /api/audit-logs/security-overview */
export interface SecurityOverview {
  /** One entry per person with a sign-in inside the token lifetime. */
  sessions: AuditLog[];
  failedLogins: AuditLog[];
}
