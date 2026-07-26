export interface PayrollBatchFilters {
  status?: string;
  projectCode?: string;
}

export interface CreatePayrollBatchInput {
  id: string;
  projectCode?: string;
  period: string;
  group: string;
  employees: number;
  overtimeHours?: number;
  grossPayroll: number;
  deductions?: number;
  netPayroll: number;
  status?: string;
}

export interface DecidePayrollBatchInput {
  decision: "approved" | "rejected";
  reviewedBy: string;
  comment?: string;
}