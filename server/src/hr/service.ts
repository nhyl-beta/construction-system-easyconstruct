import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type {
  AttendanceInput,
  AttendanceQuery,
  CreateEmployeeInput,
  PayrollGenerateInput,
  PayrollQuery,
  UpdateAttendanceInput,
  UpdateEmployeeInput,
} from "./validators.js";
import { db } from "../db/connection.js";
import { employees } from "../db/schema/employees.js";

const asNumber = (value: string | number | null | undefined) =>
  value === null || value === undefined ? 0 : Number(value);

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 5);
}

function hoursBetween(clockIn?: string | null, clockOut?: string | null) {
  if (!clockIn || !clockOut) return null;
  const [inHour, inMinute] = clockIn.split(":").map(Number);
  const [outHour, outMinute] = clockOut.split(":").map(Number);
  let minutes = outHour * 60 + outMinute - (inHour * 60 + inMinute);
  if (minutes < 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 10) / 10;
}

function periodLabel(start: string, end: string) {
  return `${start} to ${end}`;
}

function hourlyRate(employee: { payRate: string; rateType: string }) {
  const rate = asNumber(employee.payRate);
  if (employee.rateType === "Daily") return rate / 8;
  if (employee.rateType === "Monthly") return rate / (22 * 8);
  return rate;
}

export async function listEmployees(filters: {
  search?: string;
  department?: string;
  status?: string;
}) {
  return repo.findEmployees(filters);
}

export async function getEmployee(id: number) {
  const employee = await repo.findEmployee(id);
  if (!employee) throw new NotFoundError("Employee", String(id));
  return employee;
}

export async function createEmployee(input: CreateEmployeeInput) {
  if (await repo.findEmployeeByEmployeeId(input.employeeId)) {
    throw new ConflictError(`Employee ID ${input.employeeId} already exists`);
  }
  return repo.insertEmployee({
    ...input,
    initials: initials(input.name),
    email: input.email || null,
    phone: input.phone || null,
    payRate: String(input.payRate ?? 0),
  });
}

export async function updateEmployee(id: number, input: UpdateEmployeeInput) {
  const existing = await getEmployee(id);
  if (input.employeeId && input.employeeId !== existing.employeeId) {
    const duplicate = await repo.findEmployeeByEmployeeId(input.employeeId);
    if (duplicate) throw new ConflictError(`Employee ID ${input.employeeId} already exists`);
  }
  return repo.updateEmployee(id, {
    ...input,
    ...(input.name ? { initials: initials(input.name) } : {}),
    ...(input.email !== undefined ? { email: input.email || null } : {}),
    ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
    ...(input.payRate !== undefined ? { payRate: String(input.payRate) } : {}),
  });
}

export async function removeEmployee(id: number) {
  await getEmployee(id);
  const deleted = await repo.deleteEmployee(id);
  if (!deleted) throw new NotFoundError("Employee", String(id));
  return deleted;
}

export async function listAttendance(query: AttendanceQuery) {
  return repo.findAttendance(query);
}

export async function createAttendance(input: AttendanceInput) {
  const employee = await repo.findEmployeeByEmployeeId(input.employeeId);
  if (!employee) throw new ValidationError(`Employee ${input.employeeId} does not exist`);
  const hours = input.hours ?? hoursBetween(input.clockIn, input.clockOut);
  const flagged =
    input.status === "Flagged" ||
    input.geofence === "Outside" ||
    input.photo === "Failed";
  return repo.insertAttendance({
    ...input,
    hours: hours === null ? null : hours.toFixed(1),
    geofence: input.geofence ?? "Inside",
    photo: input.photo ?? "Pending",
    status: flagged ? "Flagged" : input.status ?? (input.clockOut ? "Verified" : "Pending"),
  });
}

export async function updateAttendance(id: number, input: UpdateAttendanceInput) {
  const existing = await repo.findAttendanceById(id);
  if (!existing) throw new NotFoundError("Attendance record", String(id));
  if (input.employeeId && !(await repo.findEmployeeByEmployeeId(input.employeeId))) {
    throw new ValidationError(`Employee ${input.employeeId} does not exist`);
  }
  const clockIn = input.clockIn ?? existing.clockIn;
  const clockOut = input.clockOut === undefined ? existing.clockOut : input.clockOut;
  const hours =
    input.hours === undefined ? hoursBetween(clockIn, clockOut) ?? existing.hours : input.hours;
  const geofence = input.geofence ?? existing.geofence;
  const photo = input.photo ?? existing.photo;
  const status =
    input.status ??
    (geofence === "Outside" || photo === "Failed"
      ? "Flagged"
      : clockOut
        ? "Verified"
        : existing.status);
  return repo.updateAttendance(id, {
    ...input,
    ...(hours !== null && hours !== undefined ? { hours: Number(hours).toFixed(1) } : {}),
    status,
  });
}

export async function removeAttendance(id: number) {
  const existing = await repo.findAttendanceById(id);
  if (!existing) throw new NotFoundError("Attendance record", String(id));
  return repo.deleteAttendance(id);
}

export async function attendanceSummary(date: string) {
  const [activeEmployees, logs] = await Promise.all([
    repo.findEmployees({ status: "Active" }),
    repo.findAttendance({ date }),
  ]);
  const verified = logs.filter((log) => log.status === "Verified").length;
  const pending = logs.filter((log) => log.status === "Pending").length;
  const flagged = logs.filter(
    (log) => log.status === "Flagged" || log.geofence === "Outside" || log.photo === "Failed",
  ).length;
  const late = logs.filter((log) => log.clockIn > "08:00").length;
  return {
    date,
    totalEmployees: activeEmployees.length,
    recorded: logs.length,
    verified,
    pending,
    flagged,
    late,
    absent: Math.max(activeEmployees.length - logs.length, 0),
    onTimeRate: logs.length ? Math.round(((logs.length - late) / logs.length) * 1000) / 10 : 0,
  };
}

async function payrollRowsForPeriod(start: string, end: string, deductionRate: number) {
  const [activeEmployees, logs] = await Promise.all([
    repo.findEmployees({ status: "Active" }),
    repo.findAttendance({ from: start, to: end }),
  ]);
  return activeEmployees.map((employee) => {
    const employeeLogs = logs.filter((log) => log.employeeId === employee.employeeId);
    const totalHours = employeeLogs.reduce(
      (sum, log) => sum + asNumber(log.hours ?? hoursBetween(log.clockIn, log.clockOut)),
      0,
    );
    const regularHours = Math.min(totalHours, employeeLogs.length * 8);
    const overtime = Math.max(0, totalHours - regularHours);
    const rate = hourlyRate(employee);
    const gross = regularHours * rate + overtime * rate * 1.25;
    const deductions = gross * deductionRate;
    return {
      empId: employee.employeeId,
      name: employee.name,
      initials: employee.initials,
      role: employee.role,
      hours: Math.round(regularHours),
      overtime: Math.round(overtime),
      gross: gross.toFixed(2),
      deductions: deductions.toFixed(2),
      net: (gross - deductions).toFixed(2),
      status: "Pending",
      period: periodLabel(start, end),
      periodStart: start,
      periodEnd: end,
    };
  });
}

export async function generatePayroll(input: PayrollGenerateInput) {
  if (input.periodStart > input.periodEnd) {
    throw new ValidationError("Period start must be before period end");
  }
  const period = periodLabel(input.periodStart, input.periodEnd);
  const rows = await payrollRowsForPeriod(
    input.periodStart,
    input.periodEnd,
    input.deductionRate ?? 0.1,
  );
  await repo.deletePayrollPeriod(period);
  const inserted = await repo.insertPayroll(rows);
  return {
    period,
    deductionRate: input.deductionRate ?? 0.1,
    count: inserted.length,
    totals: summarizePayroll(rows),
    rows: inserted,
  };
}

function summarizePayroll(rows: Array<{ gross: string; deductions: string; net: string; overtime: number }>) {
  return rows.reduce(
    (summary, row) => ({
      grossLabor: summary.grossLabor + asNumber(row.gross),
      deductions: summary.deductions + asNumber(row.deductions),
      netPayable: summary.netPayable + asNumber(row.net),
      overtimeHours: summary.overtimeHours + row.overtime,
    }),
    { grossLabor: 0, deductions: 0, netPayable: 0, overtimeHours: 0 },
  );
}

export async function getPayroll(query: PayrollQuery) {
  const rows = await repo.findPayroll(query.period);
  return { rows, totals: summarizePayroll(rows) };
}

export async function getTracksheet(query: PayrollQuery) {
  if (!query.periodStart || !query.periodEnd) {
    throw new ValidationError("periodStart and periodEnd are required");
  }
  const logs = await repo.findAttendance({
    from: query.periodStart,
    to: query.periodEnd,
  });
  const employeeIds = [...new Set(logs.map((log) => log.employeeId))];
  const employeesById = new Map(
    (await Promise.all(employeeIds.map((id) => repo.findEmployeeByEmployeeId(id)))).filter(
      (employee): employee is NonNullable<typeof employee> => Boolean(employee),
    ).map((employee) => [employee.employeeId, employee]),
  );
  return logs.map((log) => ({
    ...log,
    employee: employeesById.get(log.employeeId)?.name ?? log.employeeId,
    regularHours: Math.min(asNumber(log.hours), 8),
    overtimeHours: Math.max(0, asNumber(log.hours) - 8),
  }));
}

export async function getGrossLabor(query: PayrollQuery) {
  const rows = await repo.findPayroll(query.period);
  return { period: query.period ?? "all", ...summarizePayroll(rows), employeeCount: rows.length };
}

export async function getGrossTracking(query: PayrollQuery) {
  const start = query.periodStart;
  const end = query.periodEnd;
  if (!start || !end) throw new ValidationError("periodStart and periodEnd are required");
  const rows = await payrollRowsForPeriod(start, end, 0);
  return rows.map((row) => ({
    employeeId: row.empId,
    employee: row.name,
    period: row.period,
    hours: row.hours,
    overtime: row.overtime,
    grossLabor: row.gross,
  }));
}

export async function workforceReport(from?: string, to?: string) {
  const [allEmployees, logs] = await Promise.all([
    repo.findEmployees({}),
    repo.findAttendance({ from, to }),
  ]);
  const byDepartment = new Map<string, { department: string; headcount: number; active: number }>();
  const bySite = new Map<string, { site: string; headcount: number; present: number }>();
  for (const employee of allEmployees) {
    const department = byDepartment.get(employee.department) ?? {
      department: employee.department,
      headcount: 0,
      active: 0,
    };
    department.headcount += 1;
    if (employee.status === "Active") department.active += 1;
    byDepartment.set(employee.department, department);
    const site = bySite.get(employee.site) ?? { site: employee.site, headcount: 0, present: 0 };
    site.headcount += 1;
    bySite.set(employee.site, site);
  }
  for (const log of logs) {
    const employee = allEmployees.find((candidate) => candidate.employeeId === log.employeeId);
    if (employee) {
      const site = bySite.get(employee.site);
      if (site && log.status === "Verified") site.present += 1;
    }
  }
  const days = new Map<string, { date: string; present: number; late: number; absent: number }>();
  const recordedByDay = new Map<string, Set<string>>();
  for (const log of logs) {
    const day = days.get(log.logDate) ?? { date: log.logDate, present: 0, late: 0, absent: 0 };
    if (log.status === "Verified") day.present += 1;
    if (log.clockIn > "08:00") day.late += 1;
    days.set(log.logDate, day);
    const recorded = recordedByDay.get(log.logDate) ?? new Set<string>();
    recorded.add(log.employeeId);
    recordedByDay.set(log.logDate, recorded);
  }
  const activeCount = allEmployees.filter((employee) => employee.status === "Active").length;
  for (const [date, day] of days) {
    day.absent = Math.max(activeCount - (recordedByDay.get(date)?.size ?? 0), 0);
  }
  return {
    range: { from: from ?? null, to: to ?? null },
    totals: {
      headcount: allEmployees.length,
      active: activeCount,
      onLeave: allEmployees.filter((employee) => employee.status === "On Leave").length,
      suspended: allEmployees.filter((employee) => employee.status === "Suspended").length,
      attendanceRecords: logs.length,
    },
    byDepartment: [...byDepartment.values()],
    bySite: [...bySite.values()],
    dailyAttendance: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
