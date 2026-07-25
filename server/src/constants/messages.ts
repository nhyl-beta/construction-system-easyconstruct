const createCrudMessages = (name: string) => ({
  retrieved: `${name}s retrieved`,
  single: `${name} retrieved`,
  created: `${name} created`,
  updated: `${name} updated`,
  deleted: `${name} deleted`,
  notFound: `${name} not found`,
});

export const MSG = {
  projects: createCrudMessages("Project"),
  budgets: createCrudMessages("Budget"),
  expenses: createCrudMessages("Expense"),
  purchaseRequests: createCrudMessages("Purchase request"),
  reimbursements: createCrudMessages("Reimbursement"),
  procurementOrders: createCrudMessages("Procurement order"),
  approvalsQueue: createCrudMessages("Approval item"),
  aiInsights: createCrudMessages("AI insight"),
  financialRisks: createCrudMessages("Financial risk"),
  cashFlow: createCrudMessages("Cash flow entry"),
  scheduledReports: createCrudMessages("Scheduled report"),
} as const;