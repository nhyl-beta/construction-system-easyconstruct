import * as repository from "./repository.js";
import { NotFoundError } from "../../utils/errors.js";

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

export const createPayrollBatch = (input: CreatePayrollBatchInput) =>
  repository.create({ status: "pending", ...input });

export const decidePayrollBatch = async (
  id: string,
  input: DecidePayrollBatchInput,
) => {
  await getPayrollBatch(id); // throws NotFoundError if missing
  return repository.decide(id, input.decision, input.reviewedBy);
};