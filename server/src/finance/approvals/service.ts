import { approvalsRepository, type Reader } from "./repository.js";
import { mergePending } from "./merge.js";

export const approvalsService = {
  async list(limit: number, now: Date = new Date(), exec?: Reader) {
    const [expenses, payroll, budgets, purchaseRequests, reimbursements] = await Promise.all([
      approvalsRepository.pendingExpenses(exec),
      approvalsRepository.pendingPayroll(exec),
      approvalsRepository.pendingBudgets(exec),
      approvalsRepository.pendingPurchaseRequests(exec),
      approvalsRepository.pendingReimbursements(exec),
    ]);
    return mergePending([expenses, payroll, budgets, purchaseRequests, reimbursements], now, limit);
  },
};
