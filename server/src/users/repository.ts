import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";
import { eq } from "drizzle-orm";
import type { CreateUserInput, UpdateUserInput, UserFilters } from "./types.js";

// Never select `password`. This module serves two callers: the read-only,
// non-sensitive user picker (name/email/role) used for cross-role assignment
// UI (PM picker, engineer staffing), and IT Designer's account-management
// screen, which writes here but still never reads a hash back out.
const PUBLIC_COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
};

export const findAll = async (filters: UserFilters = {}) => {
  return filters.role
    ? await db.select(PUBLIC_COLUMNS).from(users).where(eq(users.role, filters.role))
    : await db.select(PUBLIC_COLUMNS).from(users);
};

export const findById = async (id: number) => {
  const [user] = await db.select(PUBLIC_COLUMNS).from(users).where(eq(users.id, id));
  return user ?? null;
};

export const findByEmail = async (email: string) => {
  const [user] = await db.select(PUBLIC_COLUMNS).from(users).where(eq(users.email, email));
  return user ?? null;
};

export const create = async (data: CreateUserInput) => {
  const [created] = await db.insert(users).values(data).returning(PUBLIC_COLUMNS);
  return created ?? null;
};

export const update = async (id: number, data: UpdateUserInput) => {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(PUBLIC_COLUMNS);
  return updated ?? null;
};

export const setActive = async (id: number, isActive: boolean) => {
  const [updated] = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(PUBLIC_COLUMNS);
  return updated ?? null;
};
