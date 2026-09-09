import { apiClient } from "@/services/api.client";
import { employees as mockEmployees, type Employee as MockEmployee } from "@/providers/mock-data";
import type { Employee, EmployeeInput, EmployeeQuery, EmployeeStatus } from "./types";

const USE_API = Boolean(import.meta.env.VITE_API_BASE);

export interface HrEmployee extends Employee {
  employeeId: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: string;
  site: string;
  clockIn: string;
  clockOut: string | null;
  hours: number | string | null;
  geofence: "Inside" | "Edge" | "Outside";
  photo: "Verified" | "Pending" | "Failed";
  status: "Verified" | "Pending" | "Flagged";
  logDate: string;
}

export interface AttendanceSummary {
  date: string;
  totalEmployees: number;
  recorded: number;
  verified: number;
  pending: number;
  flagged: number;
  late: number;
  absent: number;
  onTimeRate: number;
}

export interface PayrollRow {
  empId: string;
  name: string;
  initials: string;
  role: string;
  hours: number;
  overtime: number;
  gross: number | string;
  deductions: number | string;
  net: number | string;
  status: string;
  period: string;
  periodStart: string;
  periodEnd: string;
}

export interface PayrollResult {
  period?: string;
  deductionRate?: number;
  rows: PayrollRow[];
  totals: {
    grossLabor: number;
    deductions: number;
    netPayable: number;
    overtimeHours: number;
  };
}

export interface WorkforceReport {
  range: { from: string | null; to: string | null };
  totals: {
    headcount: number;
    active: number;
    onLeave: number;
    suspended: number;
    attendanceRecords: number;
  };
  byDepartment: Array<{ department: string; headcount: number; active: number }>;
  bySite: Array<{ site: string; headcount: number; present: number }>;
  dailyAttendance: Array<{ date: string; present: number; late: number; absent: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Backend → frontend normalization (backend stores status as free-text
// varchar; numeric columns like payRate/performance come back as strings
// from Drizzle's `numeric` type).
// ─────────────────────────────────────────────────────────────────────────────

interface BackendEmployee {
  id: number;
  employeeId: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  site: string;
  status: string;
  attendanceRate: number | null;
  performance: string | number | null;
  hiredOn: string;
  email: string | null;
  phone: string | null;
  payRate: string | number | null;
  rateType: string | null;
}

const VALID_STATUSES: EmployeeStatus[] = ["Active", "On Leave", "Suspended", "Archived"];

function normalizeStatus(status: string | undefined): EmployeeStatus {
  return VALID_STATUSES.includes(status as EmployeeStatus)
    ? (status as EmployeeStatus)
    : "Active";
}

function normalize(raw: BackendEmployee): Employee {
  return {
    id: raw.employeeId,
    dbId: raw.id,
    name: raw.name,
    initials: raw.initials,
    role: raw.role,
    department: raw.department,
    site: raw.site,
    status: normalizeStatus(raw.status),
    attendanceRate: Number(raw.attendanceRate ?? 0),
    performance: Number(raw.performance ?? 0),
    hiredOn: raw.hiredOn,
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    payRate: raw.payRate != null ? String(raw.payRate) : "0",
    rateType: raw.rateType ?? "Monthly",
  };
}

// Unwraps the backend's { success, message, data } envelope.
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock fallback (used when VITE_API_BASE is unset, e.g. local UI-only dev)
// ─────────────────────────────────────────────────────────────────────────────

let nextMockDbId = mockEmployees.length + 1;
const mockDbIdByEmployeeId = new Map<string, number>(
  mockEmployees.map((e, i) => [e.id, i + 1]),
);

function fromMock(e: MockEmployee): Employee {
  return {
    id: e.id,
    dbId: mockDbIdByEmployeeId.get(e.id) ?? 0,
    name: e.name,
    initials: e.initials,
    role: e.role,
    department: e.department,
    site: e.site,
    status: e.status,
    attendanceRate: e.attendanceRate,
    performance: e.performance,
    hiredOn: e.hiredOn,
    email: "",
    phone: "",
    payRate: "0",
    rateType: "Monthly",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function listEmployees(query: EmployeeQuery = {}): Promise<Employee[]> {
  if (USE_API) {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.department && query.department !== "all") params.set("department", query.department);
    if (query.status && query.status !== "all") params.set("status", query.status);
    const qs = params.toString();
    const raw = await unwrap<BackendEmployee[]>(apiClient.get(`/employees${qs ? `?${qs}` : ""}`));
    return raw.map(normalize);
  }

  await new Promise((r) => setTimeout(r, 100));
  const q = (query.search ?? "").toLowerCase();
  return mockEmployees
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
    .filter((e) => !query.department || query.department === "all" || e.department === query.department)
    .filter((e) => !query.status || query.status === "all" || e.status === query.status)
    .map(fromMock);
}

export async function getEmployee(id: number): Promise<Employee> {
  if (USE_API) {
    const raw = await unwrap<BackendEmployee>(apiClient.get(`/employees/${id}`));
    return normalize(raw);
  }

  await new Promise((r) => setTimeout(r, 80));
  const found = mockEmployees.find((_, i) => i + 1 === id);
  if (!found) throw new Error("Employee not found");
  return fromMock(found);
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  if (USE_API) {
    const raw = await unwrap<BackendEmployee>(apiClient.post("/employees", input));
    return normalize(raw);
  }

  await new Promise((r) => setTimeout(r, 80));
  const created: MockEmployee = {
    id: input.employeeId,
    name: input.name,
    initials: input.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    role: input.role,
    department: input.department,
    site: input.site,
    status: input.status ?? "Active",
    attendanceRate: 100,
    performance: 4.0,
    hiredOn: input.hiredOn,
  };
  mockEmployees.push(created);
  mockDbIdByEmployeeId.set(created.id, ++nextMockDbId);
  return fromMock(created);
}

export async function updateEmployee(id: number, input: Partial<EmployeeInput>): Promise<Employee> {
  if (USE_API) {
    const raw = await unwrap<BackendEmployee>(apiClient.patch(`/employees/${id}`, input));
    return normalize(raw);
  }

  await new Promise((r) => setTimeout(r, 80));
  const idx = mockEmployees.findIndex((_, i) => i + 1 === id);
  if (idx === -1) throw new Error("Employee not found");
  mockEmployees[idx] = {
    ...mockEmployees[idx],
    ...(input.name ? { name: input.name } : {}),
    ...(input.role ? { role: input.role } : {}),
    ...(input.department ? { department: input.department } : {}),
    ...(input.site ? { site: input.site } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.hiredOn ? { hiredOn: input.hiredOn } : {}),
  };
  return fromMock(mockEmployees[idx]);
}

export async function deleteEmployee(id: number): Promise<Employee> {
  if (USE_API) {
    const raw = await unwrap<BackendEmployee>(apiClient.del(`/employees/${id}`));
    return normalize(raw);
  }

  await new Promise((r) => setTimeout(r, 80));
  const idx = mockEmployees.findIndex((_, i) => i + 1 === id);
  if (idx === -1) throw new Error("Employee not found");
  const [removed] = mockEmployees.splice(idx, 1);
  return fromMock(removed);
}

export async function deactivateEmployee(id: number): Promise<Employee> {
  if (USE_API) {
    const raw = await unwrap<BackendEmployee>(apiClient.patch(`/employees/${id}/deactivate`, {}));
    return normalize(raw);
  }
  return updateEmployee(id, { status: "Archived" });
}

function toHrEmployee(employee: Employee): HrEmployee {
  return { ...employee, employeeId: employee.id };
}

function queryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getEmployees(filters: EmployeeQuery = {}): Promise<HrEmployee[]> {
  return (await listEmployees(filters)).map(toHrEmployee);
}

export async function getAttendance(
  query: { date?: string; from?: string; to?: string } = {},
): Promise<AttendanceRecord[]> {
  if (!USE_API) return [];
  return unwrap<AttendanceRecord[]>(
    apiClient.get(`/attendance${queryString(query)}`),
  );
}

export async function getAttendanceSummary(date?: string): Promise<AttendanceSummary> {
  if (!USE_API) {
    return {
      date: date ?? new Date().toISOString().slice(0, 10),
      totalEmployees: 0,
      recorded: 0,
      verified: 0,
      pending: 0,
      flagged: 0,
      late: 0,
      absent: 0,
      onTimeRate: 0,
    };
  }
  return unwrap<AttendanceSummary>(
    apiClient.get(`/attendance/summary${queryString({ date })}`),
  );
}

export async function getPayroll(period?: string): Promise<PayrollResult> {
  if (!USE_API) return { rows: [], totals: { grossLabor: 0, deductions: 0, netPayable: 0, overtimeHours: 0 } };
  return unwrap<PayrollResult>(apiClient.get(`/payroll${queryString({ period })}`));
}

export async function generatePayroll(input: {
  periodStart: string;
  periodEnd: string;
  deductionRate?: number;
}): Promise<PayrollResult> {
  if (!USE_API) {
    return {
      period: `${input.periodStart} to ${input.periodEnd}`,
      rows: [],
      totals: { grossLabor: 0, deductions: 0, netPayable: 0, overtimeHours: 0 },
    };
  }
  return unwrap<PayrollResult>(apiClient.post("/payroll/generate", input));
}

export async function getTracksheet(periodStart?: string, periodEnd?: string) {
  if (!USE_API) return [];
  return unwrap<AttendanceRecord[]>(
    apiClient.get(`/payroll/tracksheet${queryString({ periodStart, periodEnd })}`),
  );
}

export async function getGrossLabor(period?: string) {
  if (!USE_API) return { period: period ?? "all", grossLabor: 0, deductions: 0, netPayable: 0, overtimeHours: 0, employeeCount: 0 };
  return unwrap(apiClient.get(`/payroll/gross-labor${queryString({ period })}`));
}

export async function getGrossTracking(periodStart?: string, periodEnd?: string) {
  if (!USE_API) return [];
  return unwrap(apiClient.get(`/payroll/gross-tracking${queryString({ periodStart, periodEnd })}`));
}

export async function getWorkforceReport(from?: string, to?: string): Promise<WorkforceReport> {
  if (!USE_API) {
    return {
      range: { from: from ?? null, to: to ?? null },
      totals: { headcount: 0, active: 0, onLeave: 0, suspended: 0, attendanceRecords: 0 },
      byDepartment: [],
      bySite: [],
      dailyAttendance: [],
    };
  }
  return unwrap<WorkforceReport>(
    apiClient.get(`/reports/workforce${queryString({ from, to })}`),
  );
}
