// The one list of expense categories. Expenses, purchase requests, procurement
// orders and reimbursement claims all use it, because a budget line is matched
// by `project + category` string equality. The client keeps an identical copy
// in client/src/config/expense-categories.ts.
export const EXPENSE_CATEGORIES = ["Materials", "Equipment", "PPE", "Transport", "Services"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const isExpenseCategory = (value: string): value is ExpenseCategory =>
  (EXPENSE_CATEGORIES as readonly string[]).includes(value);
