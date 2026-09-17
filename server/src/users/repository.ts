import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";
import { eq } from "drizzle-orm";
import type { UserFilters } from "./types.js";

// Never select `password` — this module is a read-only, non-sensitive
// user picker (name/email/role) for cross-role assignment UI (PM picker,
// engineer staffing), not a general user-management endpoint.
const PUBLIC_COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
};

export const findAll = async (filters: UserFilters = {}) => {
  return filters.role
    ? await db.select(PUBLIC_COLUMNS).from(users).where(eq(users.role, filters.role))
    : await db.select(PUBLIC_COLUMNS).from(users);
};
