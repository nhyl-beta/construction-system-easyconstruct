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
