import { NotFoundError, ValidationError } from "../utils/errors.js";
import * as employeesRepo from "../employees/repository.js";
import * as repo from "./repository.js";
import * as batchRepo from "./batch-repository.js";
import type {
  GeneratePayrollInput,
  PayrollFilters,
  UpdatePayrollLineInput,
} from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Gross Labor formula (documented per HR module build brief §16):
//
//   Gross Labor = (Regular Hours × Hourly Rate) + (Overtime Hours × Hourly Rate × 1.5)
//
// Employees are paid Monthly, Daily, or Hourly (employees.rateType), so pay
// rates are first normalized to an hourly-equivalent rate:
//   - Hourly: used as-is
//   - Daily:  payRate ÷ 8   (assumes an 8-hour standard shift)
//   - Monthly: payRate ÷ (22 × 8)  (assumes ~22 working days/month)
//
// Deductions are a flat 12% placeholder (stand-in for SSS/PhilHealth/Pag-IBIG/
// withholding tax) — NOT a real statutory computation. Net = Gross − Deductions.
// This keeps the demo deterministic and documented rather than pretending to
// be a compliant payroll engine (out of scope per brief §38).
// ─────────────────────────────────────────────────────────────────────────────

const STANDARD_HOURS_PER_DAY = 8;
const WORKING_DAYS_PER_MONTH = 22;
const OVERTIME_MULTIPLIER = 1.5;
const DEDUCTION_RATE = 0.12;

function toHourlyRate(payRate: number, rateType: string): number {
  switch (rateType) {
    case "Hourly":
      return payRate;
    case "Daily":
      return payRate / STANDARD_HOURS_PER_DAY;
    case "Monthly":
    default:
      return payRate / (WORKING_DAYS_PER_MONTH * STANDARD_HOURS_PER_DAY);
  }
}

export const getAll = async (filters: PayrollFilters) => repo.findAll(filters);

export const getById = async (id: number) => {
  const line = await repo.findById(id);
  if (!line) throw new NotFoundError("Payroll line", String(id));
  return line;
};

export const listBatches = async () => batchRepo.findAll();

export const generate = async (input: GeneratePayrollInput) => {
  if (!input.entries?.length)
    throw new ValidationError("At least one employee entry is required to generate payroll");

  const createdLines = [];
  let totalGross = 0;
  let totalNet = 0;
  let totalOvertimeHours = 0;

  for (const entry of input.entries) {
    const employee = await employeesRepo.findByEmployeeId(entry.employeeId);
    if (!employee) throw new NotFoundError("Employee", entry.employeeId);

    const hourlyRate = toHourlyRate(Number(employee.payRate), employee.rateType);
    const regularHours = entry.hoursWorked;
    const overtimeHours = entry.overtimeHours ?? 0;
    const adjustments = entry.adjustments ?? 0;

    const grossLabor =
      regularHours * hourlyRate + overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
    const gross = grossLabor + adjustments;
    const deductions = Number((gross * DEDUCTION_RATE).toFixed(2));
    const net = Number((gross - deductions).toFixed(2));

    const line = await repo.create({
      empId: employee.employeeId,
      name: employee.name,
      initials: employee.initials,
      role: employee.role,
      hours: Math.round(regularHours),
      overtime: Math.round(overtimeHours),
      gross: gross.toFixed(2),
      deductions: deductions.toFixed(2),
      net: net.toFixed(2),
      status: "Pending",
      period: input.period,
    });

    createdLines.push(line);
    totalGross += gross;
    totalNet += net;
    totalOvertimeHours += overtimeHours;
  }

  // Gross Tracking rollup for this run — written to the same payroll_batches
  // table Finance's payroll-review module reads, so HR-generated runs are
  // immediately visible to Finance for approval.
  const batch = await batchRepo.create({
    id: `PAY-${Date.now()}`,
    projectCode: input.projectCode,
    period: input.period,
    group: input.group ?? "All departments",
    employees: createdLines.length,
    overtimeHours: totalOvertimeHours,
    grossPayroll: Number(totalGross.toFixed(2)),
    deductions: Number((totalGross - totalNet).toFixed(2)),
    netPayroll: Number(totalNet.toFixed(2)),
    status: "pending",
  });

  return { lines: createdLines, batch };
};

export const update = async (id: number, input: UpdatePayrollLineInput) => {
  await getById(id);
  const patch: Record<string, unknown> = { ...input };
  if (input.gross != null) patch.gross = input.gross.toFixed(2);
  if (input.deductions != null) patch.deductions = input.deductions.toFixed(2);
  if (input.net != null) patch.net = input.net.toFixed(2);

  const updated = await repo.update(id, patch);
  if (!updated) throw new NotFoundError("Payroll line", String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Payroll line", String(id));
  return deleted;
};
