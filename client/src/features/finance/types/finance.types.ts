export interface Budget {
  id: number;
  project: string;
  planned: number;
  committed: number;
  actual: number;
  fiscalYear: string;
}

export type ExpenseStatus = "pending" | "approved" | "rejected";

export interface Expense {
  id: string;
  vendor: string;
  project: string;
  category: string;
  amount: number;
  submittedAt: string;
  status: ExpenseStatus;
  anomalyScore: number | null;
  receiptUrl: string | null;
}

export interface PurchaseRequest {
  id: string;
  title: string;
  project: string;
  requestedBy: string;
  amount: number;
  requestedAt: string;
  status: string;
}

export interface Reimbursement {
  id: string;
  employee: string;
  purpose: string;
  amount: number;
  submittedAt: string;
  status: string;
}

export interface ProcurementOrder {
  id: string;
  vendor: string;
  project: string;
  items: number;
  amount: number;
  eta: string | null;
  status: string;
}

export interface Approval {
  id: string;
  kind: string;
  reference: string;
  requestedBy: string;
  amount: number;
  slaHours: number;
  status: string;
}

export interface AIInsight {
  id: string;
  category: string;
  title: string;
  body: string;
  impact: string;
  confidence: number; // 0-1
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface FinancialRisk {
  id: string;
  title: string;
  impact: string;
  project: string;
  level: RiskLevel;
}

export interface CashFlowPoint {
  month: string;
  inflow: number;
  outflow: number;
}

export interface ProjectProfitability {
  project: string;
  revenue: number;
  cost: number;
  margin: number; // 0-1
}

export interface ScheduledReport {
  id: number;
  title: string;
  cadence: string;
  time: string;
}

export interface FinanceKpis {
  totalBudget: number;
  utilizationPct: number;
  remainingBudget: number;
  monthlyExpenses: number;
  pendingPayrollReviews: number;
  outstandingInvoices: number; // TODO: 0 until an invoices table exists — see note in summary/repository.ts
  cashFlowNet: number;
  profitMargin: number;
}
