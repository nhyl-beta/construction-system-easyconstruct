// The one list of expense categories. Expenses, purchase requests, procurement
// orders and reimbursement claims all use it, because a budget line is matched
// by `project + category` string equality. Mirrors
// server/src/constants/expense-categories.ts.
export const EXPENSE_CATEGORIES = ["Materials", "Equipment", "PPE", "Transport", "Services"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const isExpenseCategory = (value: string): value is ExpenseCategory =>
  (EXPENSE_CATEGORIES as readonly string[]).includes(value);

/** A requirement's own category mapped to the nearest expense category, or "" when it is not obvious. */
export function expenseCategoryForRequirement(requirementCategory: string): ExpenseCategory | "" {
  if (isExpenseCategory(requirementCategory)) return requirementCategory;
  const c = requirementCategory.toLowerCase();
  if (/material|supply|supplies/.test(c)) return "Materials";
  if (/equipment|machine|tool/.test(c)) return "Equipment";
  if (/safety|ppe/.test(c)) return "PPE";
  if (/transport|haul|delivery/.test(c)) return "Transport";
  if (/service|labor|labour|subcontract/.test(c)) return "Services";
  return "";
}
