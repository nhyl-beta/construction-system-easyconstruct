import { ConflictError, NotFoundError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type {
  CreateEmployeeInput,
  EmployeeFilters,
  UpdateEmployeeInput,
} from "./types.js";

// Frontend forms send a full "name" (no initials field), so we derive
// initials server-side — first letter of first name + first letter of last name.
function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const getAll = async (filters: EmployeeFilters) => {
  return await repo.findAll(filters);
};

export const getById = async (id: number) => {
  const employee = await repo.findById(id);
  if (!employee) throw new NotFoundError("Employee", String(id));
  return employee;
};

export const create = async (input: CreateEmployeeInput) => {
  const existingId = await repo.findByEmployeeId(input.employeeId);
  if (existingId)
    throw new ConflictError(`Employee ID ${input.employeeId} is already in use`);

  if (input.email) {
    const existingEmail = await repo.findByEmail(input.email);
    if (existingEmail)
      throw new ConflictError(`Email ${input.email} is already in use`);
  }

  return await repo.create({
    ...input,
    email: input.email || undefined,
    phone: input.phone || undefined,
    initials: initialsFrom(input.name),
  });
};

export const update = async (id: number, input: UpdateEmployeeInput) => {
  const existing = await getById(id);

  if (input.employeeId && input.employeeId !== existing.employeeId) {
    const dup = await repo.findByEmployeeId(input.employeeId);
    if (dup)
      throw new ConflictError(`Employee ID ${input.employeeId} is already in use`);
  }

  if (input.email && input.email !== existing.email) {
    const dup = await repo.findByEmail(input.email);
    if (dup) throw new ConflictError(`Email ${input.email} is already in use`);
  }

  const patch: UpdateEmployeeInput & { initials?: string } = { ...input };
  if (input.name) patch.initials = initialsFrom(input.name);

  const updated = await repo.update(id, patch);
  if (!updated) throw new NotFoundError("Employee", String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Employee", String(id));
  return deleted;
};

// "Deactivate" per the spec is a soft delete: flips status to Archived
// rather than removing the row, so attendance/payroll history stays intact.
export const deactivate = async (id: number) => {
  return update(id, { status: "Archived" });
};