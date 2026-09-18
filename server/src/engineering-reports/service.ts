import * as repo from "./repository.js";
import { NotFoundError } from "../utils/errors.js";
import type {
  CreateEngineeringReportInput,
  UpdateEngineeringReportInput,
  EngineeringReportFilters,
} from "./types.js";

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

export const update = async (id: number, input: UpdateEngineeringReportInput) => {
  await getById(id);
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