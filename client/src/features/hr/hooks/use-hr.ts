import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createEmployee,
  deleteEmployee,
  deactivateEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "../hr-api";

import type {
  Employee,
  EmployeeInput,
  EmployeeQuery,
} from "../types";

import {
  listAttendance,
  createAttendance,
} from "../attendance-api";

import type {
  AttendanceEntry,
  AttendanceQuery,
  CreateAttendanceInput,
} from "../attendance-api";

import {
  generatePayroll,
  listPayroll,
  listPayrollBatches,
} from "../payroll-api";

import type {
  GeneratePayrollInput,
  PayrollBatch,
  PayrollLine,
} from "../payroll-api";

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────────────────────────────────────

export function useEmployees(filters: EmployeeQuery = {}) {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = filters.search;
  const department = filters.department;
  const status = filters.status;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listEmployees({
        search,
        department,
        status,
      });

      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, department, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (input: EmployeeInput) => {
      setError(null);

      try {
        const employee = await createEmployee(input);
        await load();
        return employee;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [load],
  );

  const update = useCallback(
    async (id: number, input: Partial<EmployeeInput>) => {
      setError(null);

      try {
        const employee = await updateEmployee(id, input);
        await load();
        return employee;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: number) => {
      setError(null);

      try {
        const result = await deleteEmployee(id);
        await load();
        return result;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [load],
  );

  const deactivate = useCallback(
    async (id: number) => {
      setError(null);

      try {
        const result = await deactivateEmployee(id);
        await load();
        return result;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [load],
  );

  return {
    data,
    employees: data,
    loading,
    error,
    refresh: load,
    create,
    update,
    remove,
    deactivate,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Single employee
// ─────────────────────────────────────────────────────────────────────────────

export function useEmployee(
  id: number | null | undefined,
) {
  const [data, setData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (id === null || id === undefined) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const employee = await getEmployee(id);
      setData(employee);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    employee: data,
    loading,
    error,
    refresh: load,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────────────────────────

export function useAttendance(
  query: AttendanceQuery = {},
) {
  const [data, setData] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const employeeId = query.employeeId;
  const status = query.status;
  const dateFrom = query.dateFrom;
  const dateTo = query.dateTo;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAttendance({
        employeeId,
        status,
        dateFrom,
        dateTo,
      });

      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    employeeId,
    status,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (input: CreateAttendanceInput) => {
      setError(null);

      try {
        await createAttendance(input);
        await load();
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [load],
  );

  return {
    data,
    attendance: data,
    loading,
    error,
    refresh: load,
    create,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Payroll
// ─────────────────────────────────────────────────────────────────────────────

export function usePayroll(period?: string) {
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [batches, setBatches] = useState<PayrollBatch[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [payrollLines, payrollBatches] =
        await Promise.all([
          listPayroll(period),
          listPayrollBatches(),
        ]);

      setLines(payrollLines);
      setBatches(payrollBatches);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = useCallback(
    async (input: GeneratePayrollInput) => {
      setError(null);

      try {
        const result = await generatePayroll(input);

        await load();

        return result;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [load],
  );

  return {
    data: lines,
    payroll: lines,
    lines,
    batches,
    loading,
    error,
    refresh: load,
    generate,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Payroll tracksheet
// ─────────────────────────────────────────────────────────────────────────────

export function usePayrollTracksheet(
  period?: string,
) {
  const [data, setData] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listPayroll(period);
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    tracksheet: data,
    loading,
    error,
    refresh: load,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Workforce Report
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkforceReportTotals {
  headcount: number;
  active: number;
  onLeave: number;
  suspended: number;
  attendanceRecords: number;
}

export interface WorkforceDepartmentSummary {
  department: string;
  count: number;
  active: number;
}

export interface WorkforceSiteSummary {
  site: string;
  count: number;
  active: number;
}

export interface WorkforceDailyAttendance {
  date: string;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  halfDay: number;
}

export interface WorkforceReport {
  totals: WorkforceReportTotals;
  byDepartment: WorkforceDepartmentSummary[];
  bySite: WorkforceSiteSummary[];
  dailyAttendance: WorkforceDailyAttendance[];
}

export function useWorkforceReport() {
  const {
    data: employees,
    loading: employeesLoading,
    error: employeesError,
    refresh: refreshEmployees,
  } = useEmployees();

  const {
    data: attendance,
    loading: attendanceLoading,
    error: attendanceError,
    refresh: refreshAttendance,
  } = useAttendance();

  const report = useMemo<WorkforceReport>(() => {
    const employeeList = employees ?? [];
    const attendanceList = attendance ?? [];

    // ─────────────────────────────────────────────────────────────────────────
    // Totals
    // ─────────────────────────────────────────────────────────────────────────

    const headcount = employeeList.length;

    const active = employeeList.filter(
      (employee) => employee.status === "Active",
    ).length;

    const onLeave = employeeList.filter(
      (employee) => employee.status === "On Leave",
    ).length;

    const suspended = employeeList.filter(
      (employee) => employee.status === "Suspended",
    ).length;

    const attendanceRecords = attendanceList.length;

    // ─────────────────────────────────────────────────────────────────────────
    // Department summary
    // ─────────────────────────────────────────────────────────────────────────

    const departmentMap = new Map<
      string,
      WorkforceDepartmentSummary
    >();

    for (const employee of employeeList) {
      const department =
        employee.department || "Unassigned";

      const existing = departmentMap.get(department);

      if (existing) {
        existing.count += 1;

        if (employee.status === "Active") {
          existing.active += 1;
        }
      } else {
        departmentMap.set(department, {
          department,
          count: 1,
          active:
            employee.status === "Active" ? 1 : 0,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Site summary
    // ─────────────────────────────────────────────────────────────────────────

    const siteMap = new Map<
      string,
      WorkforceSiteSummary
    >();

    for (const employee of employeeList) {
      const site = employee.site || "Unassigned";

      const existing = siteMap.get(site);

      if (existing) {
        existing.count += 1;

        if (employee.status === "Active") {
          existing.active += 1;
        }
      } else {
        siteMap.set(site, {
          site,
          count: 1,
          active:
            employee.status === "Active" ? 1 : 0,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Daily attendance
    // ─────────────────────────────────────────────────────────────────────────

    const dailyMap = new Map<
      string,
      WorkforceDailyAttendance
    >();

    for (const entry of attendanceList) {
      const date = entry.logDate;

      if (!date) {
        continue;
      }

      const existing = dailyMap.get(date);

      const summary =
        existing ??
        {
          date,
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0,
          halfDay: 0,
        };

      switch (entry.attendanceStatus) {
        case "Present":
          summary.present += 1;
          break;

        case "Absent":
          summary.absent += 1;
          break;

        case "Late":
          summary.late += 1;
          break;

        case "On Leave":
          summary.onLeave += 1;
          break;

        case "Half Day":
          summary.halfDay += 1;
          break;

        default:
          break;
      }

      dailyMap.set(date, summary);
    }

    return {
      totals: {
        headcount,
        active,
        onLeave,
        suspended,
        attendanceRecords,
      },

      byDepartment: Array.from(
        departmentMap.values(),
      ).sort((a, b) => b.count - a.count),

      bySite: Array.from(
        siteMap.values(),
      ).sort((a, b) => b.count - a.count),

      dailyAttendance: Array.from(
        dailyMap.values(),
      ).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }, [employees, attendance]);

  const refresh = useCallback(async () => {
    await Promise.all([
      refreshEmployees(),
      refreshAttendance(),
    ]);
  }, [
    refreshEmployees,
    refreshAttendance,
  ]);

  return {
    report,

    loading:
      employeesLoading ||
      attendanceLoading,

    error:
      employeesError ||
      attendanceError,

    refresh,
  };
}

