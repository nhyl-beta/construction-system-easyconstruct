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
  // Philippine statutory withholdings, each computed on its own base by the
  // server (server/src/payroll/ph-statutory.ts). `deductions` is their sum,
  // so a payslip line can be broken down instead of showing one opaque figure.
  sss: number;
  philhealth: number;
  pagibig: number;
  withholdingTax: number;
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
  sss?: string | number | null;
  philhealth?: string | number | null;
  pagibig?: string | number | null;
  withholdingTax?: string | number | null;
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
    // Rows generated before the statutory columns existed carry one blended
    // figure in `deductions` and nothing in the four breakdown columns.
    sss: Number(raw.sss ?? 0),
    philhealth: Number(raw.philhealth ?? 0),
    pagibig: Number(raw.pagibig ?? 0),
    withholdingTax: Number(raw.withholdingTax ?? 0),
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

// G5: verified attendance for a project, summed per employee — used to
// prefill the Generate form's entries instead of typing hours by hand.
export async function getAttendanceSummary(
  projectCode: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<GeneratePayrollEntry[]> {
  const params = new URLSearchParams({ projectCode });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  return unwrap<GeneratePayrollEntry[]>(apiClient.get(`/payroll/attendance-summary?${params.toString()}`));
}

export async function generatePayroll(
  input: GeneratePayrollInput,
): Promise<{ lines: PayrollLine[]; batch: PayrollBatch }> {
  const raw = await unwrap<{ lines: BackendPayrollLine[]; batch: PayrollBatch }>(
    apiClient.post("/payroll/generate", input),
  );
  return { lines: raw.lines.map(normalize), batch: raw.batch };
}
