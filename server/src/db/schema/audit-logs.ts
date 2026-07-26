import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),  // e.g. "budget", "proposal", "payroll_batch"
  entityId: varchar('entity_id', { length: 50 }).notNull(),       // stored as string — some entities use varchar PKs
  action: varchar('action', { length: 50 }).notNull(),            // e.g. "approved", "created", "rejected"
  actor: varchar('actor', { length: 100 }).notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;