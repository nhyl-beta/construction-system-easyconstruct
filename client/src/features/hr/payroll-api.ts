import { apiClient } from "@/services/api.client";

export interface PayrollLine {
  id: number;
  empId: string;
  name: string;
  initials: string;
  role: string;
  hours: number;
  overtime: number;
  gross: number;
  deductions: number;
  net: number;
  status: string;
  period: string;
}

export interface PayrollBatch {
  id: string;
  projectCode: string | null;
  period: string;
  group: string;
  employees: number;
  overtimeHours: number;
  grossPayroll: number;
  deductions: number;
  netPayroll: number;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
}

export interface GeneratePayrollEntry {
  employeeId: string;
  hoursWorked: number;
  overtimeHours?: number;
  adjustments?: number;
}

export interface GeneratePayrollInput {
  period: string;
  group?: string;
  projectCode?: string;
  entries: GeneratePayrollEntry[];
}

interface BackendPayrollLine {
  id: number;
  empId: string;
  name: string;
  initials: string;
  role: string;
  hours: number;
  overtime: number;
  gross: string | number;
  deductions: string | number;
  net: string | number;
  status: string;
  period: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

function normalize(raw: BackendPayrollLine): PayrollLine {
  return {
    id: raw.id,
    empId: raw.empId,
    name: raw.name,
    initials: raw.initials,
    role: raw.role,
    hours: raw.hours,
    overtime: raw.overtime,
    gross: Number(raw.gross),
    deductions: Number(raw.deductions),
    net: Number(raw.net),
    status: raw.status,
    period: raw.period,
  };
}

export async function listPayroll(period?: string): Promise<PayrollLine[]> {
  const qs = period ? `?period=${encodeURIComponent(period)}` : "";
  const raw = await unwrap<BackendPayrollLine[]>(apiClient.get(`/payroll${qs}`));
  return raw.map(normalize);
}

export async function listPayrollBatches(): Promise<PayrollBatch[]> {
  const raw = await unwrap<
    Array<
      Omit<PayrollBatch, "overtimeHours" | "grossPayroll" | "deductions" | "netPayroll"> & {
        overtimeHours: string | number;
        grossPayroll: string | number;
        deductions: string | number;
        netPayroll: string | number;
      }
    >
  >(apiClient.get("/payroll/batches/all"));

  return raw.map((batch) => ({
    ...batch,
    overtimeHours: Number(batch.overtimeHours),
    grossPayroll: Number(batch.grossPayroll),
    deductions: Number(batch.deductions),
    netPayroll: Number(batch.netPayroll),
  }));
}

export async function generatePayroll(
  input: GeneratePayrollInput,
): Promise<{ lines: PayrollLine[]; batch: PayrollBatch }> {
  const raw = await unwrap<{ lines: BackendPayrollLine[]; batch: PayrollBatch }>(
    apiClient.post("/payroll/generate", input),
  );
  return { lines: raw.lines.map(normalize), batch: raw.batch };
}
