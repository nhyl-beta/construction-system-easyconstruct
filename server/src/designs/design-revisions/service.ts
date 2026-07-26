// service.ts
import * as repo from "./repository.js";
import { NotFoundError } from "../../utils/errors.js";
import type { CreateDesignRevisionInput, UpdateDesignRevisionInput, DesignRevisionFilters } from "./types.js";

export const getAll = async (filters: DesignRevisionFilters) => repo.findAll(filters);
export const getById = async (id: number) => {
  const rev = await repo.findById(id);
  if (!rev) throw new NotFoundError('Design revision', String(id));
  return rev;
};
export const create = async (input: CreateDesignRevisionInput) => repo.create(input);
export const update = async (id: number, input: UpdateDesignRevisionInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError('Design revision', String(id));
  return updated;
};
export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Design revision', String(id));
  return deleted;
};