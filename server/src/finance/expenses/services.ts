import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { assertProjectWritable } from "../../lifecycle/service.js";
import { expensesRepository } from "./repository.js";
import type { CreateExpenseInput, ListExpensesQuery } from "./types.js";

export const expensesService = {
  async list(queryParams: ListExpensesQuery) {
    return expensesRepository.findMany(queryParams);
  },

  async create(input: CreateExpenseInput) {
    if (input.amount <= 0) {
      throw new ValidationError("Amount must be greater than zero");
    }
    await assertProjectWritable(input.project);
    return expensesRepository.create(input);
  },

  async approve(id: string) {
    const existing = await expensesRepository.findById(id);
    if (!existing) throw new NotFoundError("Expense", id);
    await assertProjectWritable(existing.project);
    const row = await expensesRepository.updateStatus(id, "approved");
    if (!row) {
      throw new NotFoundError("Expense", id);
    }
    return row;
  },

  async reject(id: string) {
    const existing = await expensesRepository.findById(id);
    if (!existing) throw new NotFoundError("Expense", id);
    await assertProjectWritable(existing.project);
    const row = await expensesRepository.updateStatus(id, "rejected");
    if (!row) {
      throw new NotFoundError("Expense", id);
    }
    return row;
  },
};
