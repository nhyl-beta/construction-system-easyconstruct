export interface AuditLogRecord {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  summary: string | null;
  createdAt: Date | null;
}

export interface CreateAuditLogInput {
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  summary?: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
}