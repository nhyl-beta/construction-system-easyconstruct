// server/src/milestones/service.ts — NEW
import { NotFoundError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type { CreateMilestoneInput, UpdateMilestoneInput } from "./types.js";

export const getAll = async (projectCode?: string) => repo.findAll(projectCode);

export const getById = async (id: number) => {
  const milestone = await repo.findById(id);
  if (!milestone) throw new NotFoundError("Milestone", String(id));
  return milestone;
};

/**
 * Every milestone starts as a draft — an estimate the Project Manager is
 * staking out, not a commitment the project is yet being held to. There is
 * no path to create one in any other status; a draft is promoted later
 * through `update()`, a deliberate second step.
 */
export const create = async (input: CreateMilestoneInput, createdBy: string) => {
  const created = await repo.create({ ...input, createdBy, status: "draft" });
  if (!created) throw new Error("Failed to create milestone");
  return created;
};

export const update = async (id: number, input: UpdateMilestoneInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("Milestone", String(id));
  return updated;
};

export const remove = async (id: number) => {
  const existing = await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Milestone", String(id));
  return existing;
};
