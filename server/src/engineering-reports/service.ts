import * as repo from "./repository.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import type {
  CreateEngineeringReportInput,
  UpdateEngineeringReportInput,
  EngineeringReportFilters,
} from "./types.js";

// A report's own author (engineer) can edit its content while it's still
// theirs to write, but deciding it — Approved, Rejected or sent back for
// Revision — is a PM/admin call; otherwise an engineer could self-approve
// the report the moment they filed it.
const DECISION_STATUSES = new Set(["Approved", "Rejected", "Revision Required"]);

const assertCanSetStatus = (status: string | undefined, actorRole: string) => {
  if (!status || !DECISION_STATUSES.has(status)) return;
  if (actorRole === "admin" || actorRole === "project-manager") return;
  throw new ForbiddenError(
    `Role '${actorRole}' cannot set an engineering report to '${status}'; only the Project Manager or Admin can decide it`,
  );
};

export const getAll = async (filters: EngineeringReportFilters) => {
  return await repo.findAll(filters);
};

export const getById = async (id: number) => {
  const report = await repo.findById(id);
  if (!report) throw new NotFoundError("Engineering report", String(id));
  return report;
};

export const create = async (input: CreateEngineeringReportInput) => {
  const reportId =
    input.reportId ??
    `SR-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  return await repo.create({ status: "Submitted", ...input, reportId });
};

export const update = async (
  id: number,
  input: UpdateEngineeringReportInput,
  actorRole: string,
) => {
  await getById(id);
  assertCanSetStatus(input.status, actorRole);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("Engineering report", String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Engineering report", String(id));
  return deleted;
};