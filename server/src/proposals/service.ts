import { NotFoundError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type {
  CreateProposalInput,
  ProposalFilters,
  UpdateProposalInput,
} from "./types.js";

export const getAll = async (filters: ProposalFilters) => repo.findAll(filters);

export const getById = async (id: number) => {
  const proposal = await repo.findById(id);
  if (!proposal) throw new NotFoundError("Proposal", String(id));
  return proposal;
};

export const create = async (input: CreateProposalInput) => repo.create(input);

export const update = async (id: number, input: UpdateProposalInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("Proposal", String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Proposal", String(id));
  return deleted;
};
