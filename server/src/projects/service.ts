import * as repo           from "./repository.js";
import { NotFoundError }   from "../utils/errors.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilters,
} from "./types.js";

export const getAll = async (filters: ProjectFilters) => {
  return await repo.findAll(filters);
};

export const getById = async (id: number) => {
  const project = await repo.findById(id);
  if (!project) throw new NotFoundError('Project', String(id));
  return project;
};

export const create = async (input: CreateProjectInput) => {
  return await repo.create(input);
};

export const update = async (id: number, input: UpdateProjectInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError('Project', String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Project', String(id));
  return deleted;
};