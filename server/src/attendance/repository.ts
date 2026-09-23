import { and, eq, gte, lte, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { attendance } from "../db/schema/attendance.js";
import type {
  AttendanceFilters,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "./types.js";

export const findAll = async (filters: AttendanceFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.employeeId)
    conditions.push(eq(attendance.employeeId, filters.employeeId));

  if (filters.projectCode)
    conditions.push(eq(attendance.projectCode, filters.projectCode));

  if (filters.status && filters.status !== "all")
    conditions.push(eq(attendance.attendanceStatus, filters.status));

  if (filters.dateFrom) conditions.push(gte(attendance.logDate, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(attendance.logDate, filters.dateTo));

  return conditions.length
    ? await db.select().from(attendance).where(and(...conditions))
    : await db.select().from(attendance);
};

// G5: verification status (Verified/Flagged/Pending, attendance.status) is a
// separate column from attendanceStatus (Present/Absent/…, what findAll's
// own `status` filter already reads) — payroll only wants hours HR has
// actually verified, so this is a dedicated query rather than overloading
// findAll's filter to mean two different columns.
export const findVerified = async (filters: { projectCode: string; dateFrom?: string; dateTo?: string }) => {
  const conditions: SQL[] = [
    eq(attendance.projectCode, filters.projectCode),
    eq(attendance.status, "Verified"),
  ];
  if (filters.dateFrom) conditions.push(gte(attendance.logDate, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(attendance.logDate, filters.dateTo));
  return db.select().from(attendance).where(and(...conditions));
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(attendance).where(eq(attendance.id, id));
  return row ?? null;
};

export const create = async (data: CreateAttendanceInput & { hours?: string }) => {
  const [created] = await db.insert(attendance).values(data).returning();
  return created;
};

export const update = async (id: number, data: UpdateAttendanceInput & { hours?: string }) => {
  const [updated] = await db
    .update(attendance)
    .set(data)
    .where(eq(attendance.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(attendance).where(eq(attendance.id, id)).returning();
  return deleted ?? null;
};