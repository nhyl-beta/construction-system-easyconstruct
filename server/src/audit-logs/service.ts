import * as repo from "./repository.js";
import type { AuditLogFilters, CreateAuditLogInput } from "./types.js";

export const getAll = async (filters: AuditLogFilters) => repo.findAll(filters);

// Called directly by other domain services — no HTTP loopback.
export const create = async (input: CreateAuditLogInput) => repo.create(input);
