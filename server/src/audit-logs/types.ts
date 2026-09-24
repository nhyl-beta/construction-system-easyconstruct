export interface AuditLogRecord {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  summary: string | null;
  projectCode: string | null;
  createdAt: Date | null;
}

export interface CreateAuditLogInput {
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  summary?: string;
  projectCode?: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  projectCode?: string;
}