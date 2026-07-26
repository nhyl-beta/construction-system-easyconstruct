import * as repo from "./repository.js";
import { NotFoundError } from "../../utils/errors.js";
import type { CreateDesignReviewInput, DecideDesignReviewInput, DesignReviewFilters } from "./types.js";

export const getAll = async (filters: DesignReviewFilters) => repo.findAll(filters);
export const getById = async (id: number) => {
  const review = await repo.findById(id);
  if (!review) throw new NotFoundError('Design review', String(id));
  return review;
};
export const create = async (input: CreateDesignReviewInput) => repo.create(input);
export const decide = async (input: DecideDesignReviewInput) => {
  await getById(input.id);
  const updated = await repo.decide(input.id, input.decision);
  if (!updated) throw new NotFoundError('Design review', String(input.id));
  return updated;
};
export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Design review', String(id));
  return deleted;
};