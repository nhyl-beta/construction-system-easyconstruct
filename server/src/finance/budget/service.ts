import * as repo from "./repository.js";
import { NotFoundError } from "../../utils/errors.js";
import type { CreateBudgetInput, UpdateBudgetInput, BudgetFilters } from "./types.js";

export const getAll = async (filters: BudgetFilters) => repo.findAll(filters);

export const getById = async (id: number) => {
  const budget = await repo.findById(id);
  if (!budget) throw new NotFoundError("Budget", String(id));
  return budget;
};

export const create = async (input: CreateBudgetInput) => repo.create(input);

export const update = async (id: number, input: UpdateBudgetInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("Budget", String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Budget", String(id));
  return deleted;
};