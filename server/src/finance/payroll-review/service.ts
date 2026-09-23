import * as repository from "./repository.js";
import { NotFoundError } from "../../utils/errors.js";
import { refreshProjectProgress } from "../../lifecycle/service.js";

import type {
  PayrollBatchFilters,
  CreatePayrollBatchInput,
  DecidePayrollBatchInput,
} from "./types.js";

export const listPayrollBatches = (filters: PayrollBatchFilters) =>
  repository.findAll(filters);

export const getPayrollBatch = async (id: string) => {
  const batch = await repository.findById(id);
  if (!batch) throw new NotFoundError("Payroll batch", id);
  return batch;
};

export const createPayrollBatch = async (input: CreatePayrollBatchInput) => {
  const created = await repository.create({ status: "pending", ...input });
  if (created.projectCode) await refreshProjectProgress(created.projectCode);
  return created;
};

export const decidePayrollBatch = async (
  id: string,
  input: DecidePayrollBatchInput,
) => {
  await getPayrollBatch(id); // throws NotFoundError if missing
  const decided = await repository.decide(id, input.decision, input.reviewedBy);
  // Gate X3 reads whether an approved-since-Closeout batch exists and
  // whether any batch is still pending.
  if (decided?.projectCode) await refreshProjectProgress(decided.projectCode);
  return decided;
};