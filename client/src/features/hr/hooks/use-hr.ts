import { useCallback, useEffect, useState } from "react";

import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "../hr-api";

import type { Employee, EmployeeInput } from "../types";

import {
  listAttendance,
  type AttendanceEntry,
  type AttendanceQuery,
} from "../attendance-api";

import {
  generatePayroll,
  listPayroll,
  listPayrollBatches,
  type GeneratePayrollInput,
  type PayrollBatch,
  type PayrollLine,
} from "../payroll-api";

/* -------------------------------------------------------------------------- */
/* Shared async state                                                         */
/* -------------------------------------------------------------------------- */

function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
  };
}

/* -------------------------------------------------------------------------- */
/* Employees                                                                  */
/* -------------------------------------------------------------------------- */

export function useEmployees(
  filters: {
    search?: string;
    department?: string;
    status?: string;
  } = {},
) {
  const {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
  } = useAsyncState<Employee[]>();

  const { search, department, status } = filters;

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const employees = await listEmployees({
        search,
        department,
        status,
      });

      setData(employees);
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load employees",
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    department,
    status,
    setData,
    setError,
    setLoading,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (input: EmployeeInput) => {
      const employee = await createEmployee(input);
      await load();
      return employee;
    },
    [load],
  );

  const update = useCallback(
    async (id: number, input: Partial<EmployeeInput>) => {
      const employee = await updateEmployee(id, input);
      await load();
      return employee;
    },
    [load],
  );

  const remove = useCallback(
    async (id: number) => {
      const employee = await deleteEmployee(id);
      await load();
      return employee;
    },
    [load],
  );

  return {
    employees: data ?? [],
    loading,
    error,
    refresh: load,
    create,
    update,
    remove,
  };
}

/* -------------------------------------------------------------------------- */
/* Attendance                                                                 */
/* -------------------------------------------------------------------------- */

export function useAttendance(
  query: AttendanceQuery = {},
) {
  const {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
  } = useAsyncState<AttendanceEntry[]>();

  const employeeId = query.employeeId;
  const status = query.status;
  const dateFrom = query.dateFrom;
  const dateTo = query.dateTo;

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const records = await listAttendance({
        employeeId,
        status,
        dateFrom,
        dateTo,
      });

      setData(records);
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load attendance",
      );
    } finally {
      setLoading(false);
    }
  }, [
    employeeId,
    status,
    dateFrom,
    dateTo,
    setData,
    setError,
    setLoading,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    records: data ?? [],
    loading,
    error,
    refresh: load,
  };
}

/* -------------------------------------------------------------------------- */
/* Payroll                                                                    */
/* -------------------------------------------------------------------------- */

export function usePayroll(period?: string) {
  const {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
  } = useAsyncState<PayrollLine[]>();

  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const payroll = await listPayroll(period);

      setData(payroll);
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load payroll",
      );
    } finally {
      setLoading(false);
    }
  }, [
    period,
    setData,
    setError,
    setLoading,
  ]);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);

    try {
      const result = await listPayrollBatches();

      setBatches(result);
      setBatchesError(null);
    } catch (error) {
      setBatchesError(
        error instanceof Error
          ? error.message
          : "Failed to load payroll batches",
      );
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadBatches();
  }, [load, loadBatches]);

  const generate = useCallback(
    async (input: GeneratePayrollInput) => {
      const result = await generatePayroll(input);

      await load();
      await loadBatches();

      return result;
    },
    [load, loadBatches],
  );

  return {
    payroll: data ?? [],
    batches,

    loading,
    batchesLoading,

    error,
    batchesError,

    refresh: load,
    refreshBatches: loadBatches,

    generate,
  };
}

/* -------------------------------------------------------------------------- */
/* Payroll tracksheet                                                         */
/* -------------------------------------------------------------------------- */

export function usePayrollTracksheet(period?: string) {
  const {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
  } = useAsyncState<PayrollLine[]>();

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const tracksheet = await listPayroll(period);

      setData(tracksheet);
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load payroll tracksheet",
      );
    } finally {
      setLoading(false);
    }
  }, [
    period,
    setData,
    setError,
    setLoading,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    tracksheet: data ?? [],
    loading,
    error,
    refresh: load,
  };
}

