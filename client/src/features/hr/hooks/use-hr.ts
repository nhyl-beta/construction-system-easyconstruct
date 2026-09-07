import { useCallback, useEffect, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  generatePayroll,
  getAttendance,
  getAttendanceSummary,
  getEmployees,
  getGrossLabor,
  getGrossTracking,
  getPayroll,
  getTracksheet,
  getWorkforceReport,
  updateEmployee,
  type AttendanceRecord,
  type AttendanceSummary,
  type HrEmployee,
  type PayrollResult,
  type WorkforceReport,
} from "../hr-api";

function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  return { data, setData, loading, setLoading, error, setError };
}

export function useEmployees(filters: {
  search?: string;
  department?: string;
  status?: string;
} = {}) {
  const state = useAsyncState<HrEmployee[]>();
  const load = useCallback(async () => {
    state.setLoading(true);
    try {
      state.setData(await getEmployees(filters));
      state.setError(null);
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Failed to load employees");
    } finally {
      state.setLoading(false);
    }
  }, [filters.search, filters.department, filters.status]);

  useEffect(() => { void load(); }, [load]);

  return {
    employees: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: load,
    create: createEmployee,
    update: updateEmployee,
    remove: deleteEmployee,
  };
}

export function useAttendance(date?: string) {
  const records = useAsyncState<AttendanceRecord[]>();
  const summary = useAsyncState<AttendanceSummary>();
  const load = useCallback(async () => {
    records.setLoading(true);
    summary.setLoading(true);
    try {
      const [nextRecords, nextSummary] = await Promise.all([
        getAttendance(date ? { date } : {}),
        getAttendanceSummary(date),
      ]);
      records.setData(nextRecords);
      summary.setData(nextSummary);
      records.setError(null);
      summary.setError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load attendance";
      records.setError(message);
      summary.setError(message);
    } finally {
      records.setLoading(false);
      summary.setLoading(false);
    }
  }, [date]);
  useEffect(() => { void load(); }, [load]);
  return {
    records: records.data ?? [],
    summary: summary.data,
    loading: records.loading || summary.loading,
    error: records.error ?? summary.error,
    refresh: load,
  };
}

export function usePayroll(period?: string) {
  const state = useAsyncState<PayrollResult>();
  const load = useCallback(async () => {
    state.setLoading(true);
    try {
      state.setData(await getPayroll(period));
      state.setError(null);
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Failed to load payroll");
    } finally {
      state.setLoading(false);
    }
  }, [period]);
  useEffect(() => { void load(); }, [load]);
  return {
    payroll: state.data,
    loading: state.loading,
    error: state.error,
    refresh: load,
    generate: generatePayroll,
    getTracksheet,
    getGrossLabor,
    getGrossTracking,
  };
}

export function useWorkforceReport(from?: string, to?: string) {
  const state = useAsyncState<WorkforceReport>();
  const load = useCallback(async () => {
    state.setLoading(true);
    try {
      state.setData(await getWorkforceReport(from, to));
      state.setError(null);
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Failed to load workforce report");
    } finally {
      state.setLoading(false);
    }
  }, [from, to]);
  useEffect(() => { void load(); }, [load]);
  return { report: state.data, loading: state.loading, error: state.error, refresh: load };
}
