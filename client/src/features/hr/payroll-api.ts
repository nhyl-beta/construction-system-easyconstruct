import { apiClient } from "@/services/api.client";
import { payrollRows as mockPayrollRows } from "@/providers/mock-data";

const USE_API = Boolean(import.meta.env.VITE_API_BASE);

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

function fromMock(): PayrollLine[] {
  return mockPayrollRows.map((p, i) => ({
    id: i + 1,
    empId: p.empId,
    name: p.name,
    initials: p.initials,
    role: p.role,
    hours: p.hours,
    overtime: p.overtime,
    gross: p.gross,
    deductions: p.deductions,
    net: p.net,
    status: p.status,
    period: "Current period",
  }));
}

export async function listPayroll(period?: string): Promise<PayrollLine[]> {
  if (USE_API) {
    const qs = period ? `?period=${encodeURIComponent(period)}` : "";
    const raw = await unwrap<BackendPayrollLine[]>(apiClient.get(`/payroll${qs}`));
    return raw.map(normalize);
  }
  await new Promise((r) => setTimeout(r, 100));
  return fromMock();
}

export async function listPayrollBatches(): Promise<PayrollBatch[]> {
  if (USE_API) {
    return await unwrap<PayrollBatch[]>(apiClient.get("/payroll/batches/all"));
  }
  await new Promise((r) => setTimeout(r, 80));
  return [];
}

export async function generatePayroll(
  input: GeneratePayrollInput,
): Promise<{ lines: PayrollLine[]; batch: PayrollBatch }> {
  if (USE_API) {
    const raw = await unwrap<{ lines: BackendPayrollLine[]; batch: PayrollBatch }>(
      apiClient.post("/payroll/generate", input),
    );
    return { lines: raw.lines.map(normalize), batch: raw.batch };
  }
  throw new Error("Payroll generation requires the API (set VITE_API_BASE).");
}
