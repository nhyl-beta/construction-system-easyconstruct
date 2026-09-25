// Part C3/C4/E: a single, real cross-project workforce data path, shared by
// admin-dashboard.tsx's "Workforce snapshot" card and hr-dashboard.tsx's
// WorkforceSection — one query set, not two ad-hoc ones. Built on the
// existing, already-unrestricted GET /employees and GET /attendance
// endpoints (both open to any authenticated role — see
// server/src/employees/routes.ts / server/src/attendance/routes.ts); no new
// server endpoint was needed since neither read was ever role/project
// filtered to begin with.
import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/services/api.client";

export interface EmployeeRow {
  id: number;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  site: string;
  status: string;
  attendanceRate: number;
  performance: string;
  hiredOn: string;
  payRate: string;
  rateType: string;
}

interface AttendanceRow {
  id: number;
  employeeId: string;
  site: string;
  hours: string | null;
  attendanceStatus: string;
  logDate: string;
}

export interface WorkforceSiteSummary {
  site: string;
  capacity: number;
  assigned: number;
  available: number;
}

export interface WorkforceSnapshot {
  loading: boolean;
  error: Error | null;
  totalEmployees: number;
  totalCapacity: number; // Active employees org-wide
  assignedRecently: number; // distinct employees with an attendance row in the last 30 days
  available: number; // capacity - assignedRecently, floored at 0
  overtimeCrews: number; // distinct employees whose most recent attendance row logged >8h
  sites: WorkforceSiteSummary[];
  windowDays: number;
  reload: () => void;
}

const WINDOW_DAYS = 30;

export function useWorkforceSnapshot(): WorkforceSnapshot {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([apiClient.get("/employees"), apiClient.get("/attendance")])
      .then(([empRes, attRes]: [any, any]) => {
        setEmployees(empRes.data ?? []);
        setAttendance(attRes.data ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error("Failed to load workforce data.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = employees.filter((e) => e.status === "Active");
  const totalCapacity = active.length;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
  const recentAttendance = attendance.filter((a) => new Date(a.logDate) >= cutoff);
  const assignedEmployeeIds = new Set(recentAttendance.map((a) => a.employeeId));
  const assignedRecently = assignedEmployeeIds.size;
  const available = Math.max(0, totalCapacity - assignedRecently);

  const overtimeEmployeeIds = new Set(
    recentAttendance.filter((a) => Number(a.hours ?? 0) > 8).map((a) => a.employeeId),
  );
  const overtimeCrews = overtimeEmployeeIds.size;

  const siteMap = new Map<string, { capacity: number; assigned: number }>();
  for (const e of active) {
    const entry = siteMap.get(e.site) ?? { capacity: 0, assigned: 0 };
    entry.capacity += 1;
    siteMap.set(e.site, entry);
  }
  for (const empId of assignedEmployeeIds) {
    const emp = employees.find((e) => e.employeeId === empId);
    if (!emp) continue;
    const entry = siteMap.get(emp.site);
    if (entry) entry.assigned += 1;
  }
  const sites: WorkforceSiteSummary[] = Array.from(siteMap.entries())
    .map(([site, v]) => ({ site, capacity: v.capacity, assigned: v.assigned, available: Math.max(0, v.capacity - v.assigned) }))
    .sort((a, b) => b.capacity - a.capacity);

  return {
    loading,
    error,
    totalEmployees: employees.length,
    totalCapacity,
    assignedRecently,
    available,
    overtimeCrews,
    sites,
    windowDays: WINDOW_DAYS,
    reload: load,
  };
}
