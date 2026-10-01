import * as repo from "./repository.js";
import type { AuditLogFilters, CreateAuditLogInput } from "./types.js";

export const getAll = async (filters: AuditLogFilters) => {
  const [data, total] = await Promise.all([repo.findAll(filters), repo.findCount(filters)]);
  return { data, total };
};

export const getFacets = async () => repo.findFacets();

// Called directly by other domain services — no HTTP loopback.
export const create = async (input: CreateAuditLogInput) => repo.create(input);

// Backs the Security / System Oversight panel: who is signed in right now
// (derived from login events — the JWT is stateless) and what failed.
export const getSecurityOverview = async () => {
  const [sessions, failedLogins, totalFailedLogins] = await Promise.all([
    repo.findRecentSessions(),
    repo.findFailedLogins(repo.FAILED_LOGINS_LIMIT),
    repo.countFailedLogins(),
  ]);
  return {
    sessions,
    failedLogins,
    // failedLogins is the newest `failedLoginsLimit` rows; this is how many
    // exist in all, so a capped list never reads as the whole picture.
    totalFailedLogins,
    failedLoginsLimit: repo.FAILED_LOGINS_LIMIT,
  };
};
