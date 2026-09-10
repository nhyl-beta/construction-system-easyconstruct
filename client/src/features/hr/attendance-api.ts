import { apiClient } from "@/services/api.client";
import { attendanceLogs as mockAttendanceLogs } from "@/providers/mock-data";

const USE_API = Boolean(import.meta.env.VITE_API_BASE);

export type AttendanceStatus = "Present" | "Absent" | "Late" | "On Leave" | "Half Day";

export interface AttendanceEntry {
  id: number;
  employeeId: string;
  name: string;
  initials: string;
  site: string;
  clockIn: string;
  clockOut: string | null;
  hours: number;
  geofence: string;
  photo: string;
  status: string; // verification status: Verified | Pending | Flagged
  attendanceStatus: AttendanceStatus;
  remarks: string | null;
  logDate: string;
}

export interface AttendanceQuery {
  employeeId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateAttendanceInput {
  employeeId: string;
  site: string;
  clockIn: string;
  clockOut?: string;
  attendanceStatus?: AttendanceStatus;
  remarks?: string;
  logDate: string;
}

interface BackendAttendance {
  id: number;
  employeeId: string;
  site: string;
  clockIn: string;
  clockOut: string | null;
  hours: string | number | null;
  geofence: string;
  photo: string;
  status: string;
  attendanceStatus: string;
  remarks: string | null;
  logDate: string;
}

async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

// Mock data doesn't carry per-employee name/initials joined server-side in the
// real API response, so we normalize from the attendance-log mock shape,
// which already includes them (unlike the DB table, which only stores employeeId).
function normalize(raw: BackendAttendance, nameLookup: Map<string, { name: string; initials: string }>): AttendanceEntry {
  const person = nameLookup.get(raw.employeeId);
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    name: person?.name ?? raw.employeeId,
    initials: person?.initials ?? "NA",
    site: raw.site,
    clockIn: raw.clockIn,
    clockOut: raw.clockOut,
    hours: raw.hours != null ? Number(raw.hours) : 0,
    geofence: raw.geofence,
    photo: raw.photo,
    status: raw.status,
    attendanceStatus: (raw.attendanceStatus as AttendanceStatus) ?? "Present",
    remarks: raw.remarks,
    logDate: raw.logDate,
  };
}

function fromMock(): AttendanceEntry[] {
  return mockAttendanceLogs.map((l, i) => ({
    id: i + 1,
    employeeId: l.empId,
    name: l.name,
    initials: l.initials,
    site: l.site,
    clockIn: l.clockIn,
    clockOut: l.clockOut,
    hours: l.hours,
    geofence: l.geofence,
    photo: l.photo,
    status: l.status,
    attendanceStatus: "Present",
    remarks: null,
    logDate: new Date().toISOString().slice(0, 10),
  }));
}

export async function listAttendance(
  query: AttendanceQuery = {},
  nameLookup: Map<string, { name: string; initials: string }> = new Map(),
): Promise<AttendanceEntry[]> {
  if (USE_API) {
    const params = new URLSearchParams();
    if (query.employeeId) params.set("employeeId", query.employeeId);
    if (query.status && query.status !== "all") params.set("status", query.status);
    if (query.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query.dateTo) params.set("dateTo", query.dateTo);
    const qs = params.toString();
    const raw = await unwrap<BackendAttendance[]>(
      apiClient.get(`/attendance${qs ? `?${qs}` : ""}`),
    );
    return raw.map((r) => normalize(r, nameLookup));
  }

  await new Promise((r) => setTimeout(r, 100));
  return fromMock();
}

export async function createAttendance(input: CreateAttendanceInput): Promise<void> {
  if (USE_API) {
    await apiClient.post("/attendance", input);
    return;
  }
  await new Promise((r) => setTimeout(r, 80));
}
