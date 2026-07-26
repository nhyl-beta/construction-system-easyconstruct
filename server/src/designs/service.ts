import { NotFoundError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type {
  CreateDesignInput,
  DesignFilters,
  UpdateDesignInput,
} from "./types.js";

export const getAll = async (filters: DesignFilters) => repo.findAll(filters);

export const getById = async (id: number) => {
  const design = await repo.findById(id);
  if (!design) throw new NotFoundError("Design", String(id));
  return design;
};

export const create = async (input: CreateDesignInput) => repo.create(input);

export const update = async (id: number, input: UpdateDesignInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("Design", String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Design", String(id));
  return deleted;
};
