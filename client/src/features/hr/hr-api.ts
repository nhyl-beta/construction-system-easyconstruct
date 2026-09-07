import { apiClient } from "@/services/api.client";

export interface HrEmployee {
  id: number;
  employeeId: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  site: string;
  email: string | null;
  phone: string | null;
  payRate: string;
  rateType: string;
  status: "Active" | "On Leave" | "Suspended" | "Archived";
  attendanceRate: number;
  performance: string;
  hiredOn: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: string;
  site: string;
  clockIn: string;
  clockOut: string | null;
  hours: string | null;
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
  id?: number;
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

export interface PayrollResult {
  rows: PayrollRow[];
  totals: {
    grossLabor: number;
    deductions: number;
    netPayable: number;
    overtimeHours: number;
  };
}

export interface GrossLaborSummary {
  period: string;
  grossLabor: number;
  deductions: number;
  netPayable: number;
  overtimeHours: number;
  employeeCount: number;
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

interface Envelope<T> {
  data: T;
}

function unwrap<T>(response: Envelope<T>): T {
  return response.data;
}

export async function getEmployees(filters: {
  search?: string;
  department?: string;
  status?: string;
} = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") query.set(key, value);
  });
  const response = await apiClient.get(`/hr/employees${query.toString() ? `?${query}` : ""}`);
  return unwrap<HrEmployee[]>(response);
}

export async function createEmployee(input: Record<string, unknown>) {
  const response = await apiClient.post("/hr/employees", input);
  return unwrap<HrEmployee>(response);
}

export async function getEmployee(id: number) {
  const response = await apiClient.get(`/hr/employees/${id}`);
  return unwrap<HrEmployee>(response);
}

export async function updateEmployee(id: number, input: Record<string, unknown>) {
  const response = await apiClient.patch(`/hr/employees/${id}`, input);
  return unwrap<HrEmployee>(response);
}

export async function deleteEmployee(id: number) {
  const response = await apiClient.del(`/hr/employees/${id}`);
  return unwrap<HrEmployee>(response);
}

export async function getAttendance(params: {
  date?: string;
  from?: string;
  to?: string;
} = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const response = await apiClient.get(`/hr/attendance${query.toString() ? `?${query}` : ""}`);
  return unwrap<AttendanceRecord[]>(response);
}

export async function getAttendanceSummary(date?: string) {
  const response = await apiClient.get(
    `/hr/attendance/summary${date ? `?date=${encodeURIComponent(date)}` : ""}`,
  );
  return unwrap<AttendanceSummary>(response);
}

export async function getPayroll(period?: string) {
  const response = await apiClient.get(
    `/hr/payroll${period ? `?period=${encodeURIComponent(period)}` : ""}`,
  );
  return unwrap<PayrollResult>(response);
}

export async function generatePayroll(input: {
  periodStart: string;
  periodEnd: string;
  deductionRate?: number;
}) {
  const response = await apiClient.post("/hr/payroll/generate", input);
  return unwrap<PayrollResult & { period: string; count: number }>(response);
}

export async function getTracksheet(periodStart: string, periodEnd: string) {
  const response = await apiClient.get(
    `/hr/payroll/tracksheet?periodStart=${encodeURIComponent(periodStart)}&periodEnd=${encodeURIComponent(periodEnd)}`,
  );
  return unwrap<Array<AttendanceRecord & {
    employee: string;
    regularHours: number;
    overtimeHours: number;
  }>>(response);
}

export async function getGrossLabor(period?: string) {
  const response = await apiClient.get(
    `/hr/payroll/gross-labor${period ? `?period=${encodeURIComponent(period)}` : ""}`,
  );
  return unwrap<GrossLaborSummary>(response);
}

export async function getGrossTracking(periodStart: string, periodEnd: string) {
  const response = await apiClient.get(
    `/hr/payroll/gross-tracking?periodStart=${encodeURIComponent(periodStart)}&periodEnd=${encodeURIComponent(periodEnd)}`,
  );
  return unwrap<Array<{
    employeeId: string;
    employee: string;
    period: string;
    hours: number;
    overtime: number;
    grossLabor: string;
  }>>(response);
}

export async function getWorkforceReport(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const response = await apiClient.get(
    `/hr/reports/workforce${query.toString() ? `?${query}` : ""}`,
  );
  return unwrap<WorkforceReport>(response);
}
