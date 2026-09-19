import { and, desc, eq, gte, SQL } from "drizzle-orm";
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

/**
 * Derived "active sessions": the most recent successful sign-in per actor,
 * within the JWT's 8h lifetime.
 *
 * There is no session table because the JWT is stateless — nothing is stored
 * server-side to enumerate. Rather than invent a session store (which would
 * be dishonest about what the auth layer actually does), this reconstructs
 * who currently holds a live token from the login events auth/service.ts
 * records, which is the same information with no new moving parts.
 */
export const findRecentSessions = async (withinHours = 8) => {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, "auth"),
        eq(auditLogs.action, "login"),
        gte(auditLogs.createdAt, since),
      ),
    )
    .orderBy(desc(auditLogs.createdAt));

  // One row per person — the newest sign-in wins.
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latest.has(row.entityId)) latest.set(row.entityId, row);
  }
  return Array.from(latest.values());
};

/** Failed sign-in attempts, newest first. */
export const findFailedLogins = async (limit = 50) => {
  return db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, "auth"),
        eq(auditLogs.action, "login-failed"),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
};
