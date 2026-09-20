import { apiClient } from "@/services/api.client";

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
  photoUrl: string | null;
  // The clock-in's recorded position and how far it was from the project's
  // registered site. The API has always returned these; the normalizer below
  // dropped them, so HR's attendance review could show a geofence verdict but
  // never the location it was based on.
  latitude: number | null;
  longitude: number | null;
  distanceFromSiteM: number | null;
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
  photoUrl: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  distanceFromSiteM: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

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
    photoUrl: raw.photoUrl ?? null,
    // numeric() columns arrive as strings from drizzle.
    latitude: raw.latitude != null ? Number(raw.latitude) : null,
    longitude: raw.longitude != null ? Number(raw.longitude) : null,
    distanceFromSiteM: raw.distanceFromSiteM ?? null,
  };
}

export async function listAttendance(
  query: AttendanceQuery = {},
  nameLookup: Map<string, { name: string; initials: string }> = new Map(),
): Promise<AttendanceEntry[]> {
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

export async function createAttendance(input: CreateAttendanceInput): Promise<void> {
  await apiClient.post("/attendance", input);
}

/**
 * Records HR's verification outcome for a clock-in. `status` is the review
 * verdict (Verified | Flagged | Pending), distinct from `attendanceStatus`
 * (Present | Absent | …) which describes the working day itself.
 */
export async function setAttendanceVerification(
  id: number,
  status: "Verified" | "Flagged" | "Pending",
  remarks?: string,
): Promise<void> {
  await apiClient.patch(`/attendance/${id}`, {
    status,
    ...(remarks !== undefined ? { remarks } : {}),
  });
}
