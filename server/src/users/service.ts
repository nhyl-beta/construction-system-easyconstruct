import bcrypt from "bcryptjs";

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
