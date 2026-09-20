import bcrypt from "bcryptjs";

import { count, eq } from "drizzle-orm";

import { db } from "../db/connection.js";
import { employees } from "../db/schema/employees.js";
import { projectMembers } from "../db/schema/project-members.js";
import { tasks } from "../db/schema/task.js";
import * as roleRepo from "../roles/repository.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
} from "./types.js";

const PASSWORD_SALT_ROUNDS = 10;

export const getAll = async (filters: UserFilters) => repo.findAll(filters);

export const getById = async (id: number) => {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError("User", String(id));
  return user;
};

// `users.role` is a plain varchar, so nothing in the database stops a typo
// from creating an account whose role no requireRole() check will ever match.
// The roles table is the authoritative list, so validate against it.
const assertRoleExists = async (role: string) => {
  const existing = await roleRepo.findByName(role);
  if (!existing) {
    throw new ValidationError(`Unknown role '${role}'`);
  }
};

export const create = async (input: CreateUserInput) => {
  await assertRoleExists(input.role);

  if (await repo.findByEmail(input.email)) {
    throw new ConflictError(`A user with email ${input.email} already exists`);
  }

  const created = await repo.create({
    ...input,
    password: await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS),
  });
  if (!created) throw new ConflictError("Could not create the user account");
  return created;
};

export const update = async (id: number, input: UpdateUserInput) => {
  await getById(id);

  if (input.role) await assertRoleExists(input.role);

  if (input.email) {
    const owner = await repo.findByEmail(input.email);
    if (owner && owner.id !== id) {
      throw new ConflictError(`A user with email ${input.email} already exists`);
    }
  }

  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("User", String(id));
  return updated;
};

/**
 * Administrative password reset: IT Designer sets a new password on any
 * account without needing the current one. The account-recovery flow
 * (POST /api/auth/forgot-password) stays the self-service path; this is the
 * one for people who can no longer reach the mailbox on the account.
 *
 * The plaintext never leaves this call — it is hashed here and the repository
 * only ever returns the public columns, so no hash is echoed back either.
 */
export const setPassword = async (id: number, password: string) => {
  await getById(id);
  const updated = await repo.setPassword(
    id,
    await bcrypt.hash(password, PASSWORD_SALT_ROUNDS),
  );
  if (!updated) throw new NotFoundError("User", String(id));
  return updated;
};

export const setActive = async (
  id: number,
  isActive: boolean,
  actingUserId: number,
) => {
  // Deactivating yourself would lock the only account that can reverse it out
  // of the system — the same fail-safe reasoning behind Owner's recovery flow.
  if (!isActive && id === actingUserId) {
    throw new ValidationError("You cannot deactivate your own account");
  }

  await getById(id);

  const updated = await repo.setActive(id, isActive);
  if (!updated) throw new NotFoundError("User", String(id));
  return updated;
};

/**
 * Permanently delete an account.
 *
 * Deliberately narrow, because this is the one irreversible action on this
 * module:
 *  - only an already-deactivated account can be removed, so deletion is
 *    always a second, separate decision after access has been revoked;
 *  - it refuses while anything still references the row (employee record,
 *    project membership, assigned task) rather than cascading, so removing a
 *    user can never silently destroy HR or project history;
 *  - you cannot delete yourself.
 *
 * Audit-log entries survive: audit_logs stores an actor *name*, not a user
 * FK, so the trail of what this person did remains intact.
 */
export const remove = async (id: number, actingUserId: number) => {
  if (id === actingUserId) {
    throw new ValidationError("You cannot delete your own account");
  }

  const user = await getById(id);

  if (user.isActive) {
    throw new ValidationError(
      "Deactivate the account before deleting it",
    );
  }

  const blockers: string[] = [];

  const [employeeRef] = await db
    .select({ n: count() })
    .from(employees)
    .where(eq(employees.userId, id));
  if ((employeeRef?.n ?? 0) > 0) blockers.push("an employee record");

  const [memberRef] = await db
    .select({ n: count() })
    .from(projectMembers)
    .where(eq(projectMembers.userId, id));
  if ((memberRef?.n ?? 0) > 0) blockers.push("project assignments");

  const [taskRef] = await db
    .select({ n: count() })
    .from(tasks)
    .where(eq(tasks.assignedToUserId, id));
  if ((taskRef?.n ?? 0) > 0) blockers.push("assigned tasks");

  if (blockers.length > 0) {
    throw new ConflictError(
      `This account still has ${blockers.join(", ")}. Reassign or remove those first — the account stays deactivated in the meantime.`,
    );
  }

  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("User", String(id));
  return deleted;
};
