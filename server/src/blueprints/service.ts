// service.ts
import * as repo from "./repository.js";
import { NotFoundError } from "../utils/errors.js";
import type { CreateBlueprintInput, UpdateBlueprintInput, BlueprintFilters } from "./types.js";

export const getAll = async (filters: BlueprintFilters) => repo.findAll(filters);
export const getById = async (id: number) => {
  const bp = await repo.findById(id);
  if (!bp) throw new NotFoundError('Blueprint', String(id));
  return bp;
};
export const create = async (input: CreateBlueprintInput) => repo.create(input);
export const update = async (id: number, input: UpdateBlueprintInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError('Blueprint', String(id));
  return updated;
};
export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Blueprint', String(id));
  return deleted;
};