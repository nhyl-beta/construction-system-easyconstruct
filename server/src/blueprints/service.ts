// service.ts
import * as repo from "./repository.js";
import { NotFoundError } from "../utils/errors.js";
import { assertProjectWritable, refreshProjectProgress } from "../lifecycle/service.js";
import type { CreateBlueprintInput, UpdateBlueprintInput, BlueprintFilters } from "./types.js";

export const getAll = async (filters: BlueprintFilters) => repo.findAll(filters);
export const getById = async (id: number) => {
  const bp = await repo.findById(id);
  if (!bp) throw new NotFoundError('Blueprint', String(id));
  return bp;
};
export const create = async (input: CreateBlueprintInput) => {
  if (input.projectCode) await assertProjectWritable(input.projectCode);
  const created = await repo.create(input);
  // projectCode is nullable until E3 wires a project onto every blueprint —
  // gate D3 (approved+current blueprint) can't read one that isn't there yet.
  if (created?.projectCode) await refreshProjectProgress(created.projectCode);
  return created;
};
export const update = async (id: number, input: UpdateBlueprintInput) => {
  const existing = await getById(id);
  if (existing.projectCode) await assertProjectWritable(existing.projectCode);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError('Blueprint', String(id));
  if (updated.projectCode) await refreshProjectProgress(updated.projectCode);
  return updated;
};
export const remove = async (id: number) => {
  const existing = await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Blueprint', String(id));
  if (existing.projectCode) await refreshProjectProgress(existing.projectCode);
  return deleted;
};