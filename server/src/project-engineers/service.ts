import { ConflictError, NotFoundError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type { CreateProjectEngineerInput, ProjectEngineerFilters } from "./types.js";

export const getAll = async (filters: ProjectEngineerFilters) => repo.findAll(filters);

export const create = async (input: CreateProjectEngineerInput) => {
  const existing = await repo.findAll({ projectCode: input.projectCode });
  if (existing.some((e) => e.userId === input.userId)) {
    throw new ConflictError("This engineer is already available on this project");
  }
  const created = await repo.create(input);
  if (!created) throw new Error("Failed to add project engineer");
  return created;
};

export const remove = async (id: number) => {
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Project engineer", String(id));
  return deleted;
};
