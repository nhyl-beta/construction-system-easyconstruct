import { notifications } from "../db/index.js";
import { auditLogs } from "../db/schema/audit-logs.js";

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
  budgetAllocations: createCrudMessages("Budget allocation"),
  budgetAdjustments: createCrudMessages("Budget adjustment"),
  budgetApprovalSteps: createCrudMessages("Budget approval step"),
  expenses: createCrudMessages("Expense"),
  payrollBatches: createCrudMessages("Payroll batch"),
  purchaseRequests: createCrudMessages("Purchase request"),
  reimbursements: createCrudMessages("Reimbursement"),
  procurementOrders: createCrudMessages("Procurement order"),
  approvalsQueue: createCrudMessages("Approval item"),
  aiInsights: createCrudMessages("AI insight"),
  financialRisks: createCrudMessages("Financial risk"),
  cashFlow: createCrudMessages("Cash flow entry"),
  scheduledReports: createCrudMessages("Scheduled report"),
  designs: createCrudMessages("Design"),
  proposals: createCrudMessages("Proposal"),
  designRevisions: createCrudMessages("Design revision"),
  designReviews: createCrudMessages("Design review"),
  architectDocuments: createCrudMessages("Architect document"),
  blueprints: createCrudMessages("Blueprint"),
  notifications: createCrudMessages("Notification"),
  auditLogs: createCrudMessages("AuditLogs")
} as const;
