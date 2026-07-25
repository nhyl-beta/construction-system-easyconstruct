import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { expensesRepository } from "../expenses/repository.js";
import type {
  CreateExpenseInput,
  ListExpensesQuery,
} from "../expenses/types.js";

export const expensesService = {
  async list(queryParams: ListExpensesQuery) {
    return expensesRepository.findMany(queryParams);
  },

  async create(input: CreateExpenseInput) {
    if (input.amount <= 0) {
      throw new ValidationError("Amount must be greater than zero");
    }
    return expensesRepository.create(input);
  },

  async approve(id: string) {
    const row = await expensesRepository.updateStatus(id, "approved");
    if (!row) {
      throw new NotFoundError("Expense", id);
    }
    return row;
  },

  async reject(id: string) {
    const row = await expensesRepository.updateStatus(id, "rejected");
    if (!row) {
      throw new NotFoundError("Expense", id);
    }
    return row;
  },
};
