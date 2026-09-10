export interface PayrollLine {
  id: number;
  empId: string;
  name: string;
  initials: string;
  role: string;
  hours: number;
  overtime: number;
  gross: string;
  deductions: string;
  net: string;
  status: string;
  period: string;
  createdAt: Date | null;
}

export interface PayrollFilters {
  period?: string;
  status?: string;
  empId?: string;
}

// One employee's worked time for a payroll period — HR confirms these
// (typically after reviewing Attendance) and the service computes gross/net.
export interface PayrollEntryInput {
  employeeId: string; // employees.employeeId
  hoursWorked: number;
  overtimeHours?: number;
  adjustments?: number; // manual +/- adjustment added to gross before deductions
}

export interface GeneratePayrollInput {
  period: string; // e.g. "Jul 20–26, 2026"
  group?: string; // department/site label for the Gross Tracking rollup
  projectCode?: string;
  entries: PayrollEntryInput[];
}

export interface UpdatePayrollLineInput {
  hours?: number;
  overtime?: number;
  gross?: number;
  deductions?: number;
  net?: number;
  status?: string;
}
