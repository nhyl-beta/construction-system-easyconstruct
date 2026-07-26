import { and, desc, eq, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { auditLogs } from "../db/schema/audit-logs.js";
import type { AuditLogFilters, CreateAuditLogInput } from "./types.js";

export const findAll = async (filters: AuditLogFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.entityType)
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  if (filters.entityId)
    conditions.push(eq(auditLogs.entityId, filters.entityId));

  return conditions.length
    ? await db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
    : await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
};

export const create = async (data: CreateAuditLogInput) => {
  const [created] = await db.insert(auditLogs).values(data).returning();
  return created;
};
