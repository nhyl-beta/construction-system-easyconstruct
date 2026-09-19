import * as repo from "./repository.js";
import type { AuditLogFilters, CreateAuditLogInput } from "./types.js";

export const getAll = async (filters: AuditLogFilters) => repo.findAll(filters);

// Called directly by other domain services — no HTTP loopback.
export const create = async (input: CreateAuditLogInput) => repo.create(input);

// Backs the Security / System Oversight panel: who is signed in right now
// (derived from login events — the JWT is stateless) and what failed.
export const getSecurityOverview = async () => {
  const [sessions, failedLogins] = await Promise.all([
    repo.findRecentSessions(),
    repo.findFailedLogins(),
  ]);
  return { sessions, failedLogins };
};
