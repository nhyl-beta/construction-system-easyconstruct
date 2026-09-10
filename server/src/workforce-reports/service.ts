import * as employeesRepo from "../employees/repository.js";
import * as attendanceRepo from "../attendance/repository.js";
import * as payrollRepo from "../payroll/repository.js";

export interface WorkforceReportFilters {
  department?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: string; // payroll period label, for the payroll summary section
}

export const getSummary = async (filters: WorkforceReportFilters) => {
  const employees = await employeesRepo.findAll({
    department: filters.department,
    status: filters.status,
  });

  const attendance = await attendanceRepo.findAll({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  const payrollLines = await payrollRepo.findAll({ period: filters.period });

  const activeEmployees = employees.filter((e) => e.status === "Active").length;
  const inactiveEmployees = employees.length - activeEmployees;

  const byDepartment: Record<string, number> = {};
  const byPosition: Record<string, number> = {};
  for (const e of employees) {
    byDepartment[e.department] = (byDepartment[e.department] ?? 0) + 1;
    byPosition[e.role] = (byPosition[e.role] ?? 0) + 1;
  }

  const attendanceByStatus: Record<string, number> = {};
  let totalHours = 0;
  for (const a of attendance) {
    attendanceByStatus[a.attendanceStatus] =
      (attendanceByStatus[a.attendanceStatus] ?? 0) + 1;
    totalHours += a.hours ? Number(a.hours) : 0;
  }

  const totalGrossLabor = payrollLines.reduce((sum, p) => sum + Number(p.gross), 0);
  const totalNetPay = payrollLines.reduce((sum, p) => sum + Number(p.net), 0);

  return {
    totalEmployees: employees.length,
    activeEmployees,
    inactiveEmployees,
    employeesByDepartment: byDepartment,
    employeesByPosition: byPosition,
    attendanceSummary: {
      totalRecords: attendance.length,
      byStatus: attendanceByStatus,
      totalHoursWorked: Number(totalHours.toFixed(1)),
    },
    payrollSummary: {
      lineCount: payrollLines.length,
      totalGrossLabor: Number(totalGrossLabor.toFixed(2)),
      totalNetPay: Number(totalNetPay.toFixed(2)),
    },
  };
};
