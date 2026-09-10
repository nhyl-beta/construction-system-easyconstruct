import { and, eq, ilike, or, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { employees } from "../db/schema/employees.js";
import type {
  CreateEmployeeInput,
  EmployeeFilters,
  UpdateEmployeeInput,
} from "./types.js";

export const findAll = async (filters: EmployeeFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.department && filters.department !== "all")
    conditions.push(eq(employees.department, filters.department));

  if (filters.status && filters.status !== "all")
    conditions.push(eq(employees.status, filters.status));

  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(employees.name, s),
        ilike(employees.employeeId, s),
        ilike(employees.role, s),
      )!,
    );
  }

  return conditions.length
    ? await db.select().from(employees).where(and(...conditions))
    : await db.select().from(employees);
};

export const findById = async (id: number) => {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id));
  return employee ?? null;
};

export const findByEmployeeId = async (employeeId: string) => {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.employeeId, employeeId));
  return employee ?? null;
};

export const findByEmail = async (email: string) => {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.email, email));
  return employee ?? null;
};

export const create = async (
  data: CreateEmployeeInput & { initials: string },
) => {
  const [created] = await db.insert(employees).values(data).returning();
  return created;
};

export const update = async (
  id: number,
  data: UpdateEmployeeInput & { initials?: string },
) => {
  const [updated] = await db
    .update(employees)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db
    .delete(employees)
    .where(eq(employees.id, id))
    .returning();
  return deleted ?? null;
};
