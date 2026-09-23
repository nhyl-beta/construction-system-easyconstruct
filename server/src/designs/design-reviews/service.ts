import * as repo from "./repository.js";
import * as designsRepo from "../repository.js";
import { NotFoundError } from "../../utils/errors.js";
import { assertProjectWritable, refreshProjectProgress } from "../../lifecycle/service.js";
import type { CreateDesignReviewInput, DecideDesignReviewInput, DesignReviewFilters } from "./types.js";

export const getAll = async (filters: DesignReviewFilters) => repo.findAll(filters);
export const getById = async (id: number) => {
  const review = await repo.findById(id);
  if (!review) throw new NotFoundError('Design review', String(id));
  return review;
};

const refreshForDesign = async (designId: number) => {
  const design = await designsRepo.findById(designId);
  if (design) await refreshProjectProgress(design.projectCode);
};

const assertWritableForDesign = async (designId: number) => {
  const design = await designsRepo.findById(designId);
  if (design) await assertProjectWritable(design.projectCode);
};

export const create = async (input: CreateDesignReviewInput) => {
  await assertWritableForDesign(input.designId);
  const created = await repo.create(input);
  await refreshForDesign(input.designId);
  return created;
};
export const decide = async (input: DecideDesignReviewInput) => {
  const existing = await getById(input.id);
  await assertWritableForDesign(existing.designId);
  const updated = await repo.decide(input.id, input.decision);
  if (!updated) throw new NotFoundError('Design review', String(input.id));
  await refreshForDesign(existing.designId);
  return updated;
};
export const remove = async (id: number) => {
  const existing = await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Design review', String(id));
  await refreshForDesign(existing.designId);
  return deleted;
};