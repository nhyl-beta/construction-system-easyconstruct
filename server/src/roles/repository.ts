import { db }    from "../db/connection.js";
import { roles } from "../db/schema/roles.js";
import { eq }    from "drizzle-orm";

export const findAll = async () => {
  return await db.select().from(roles);
};

export const findById = async (id: number) => {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id));
  return role ?? null;
};

// Looked up by the role *string* (users.role / requireRole()), not the PK —
// used to reject an account being created against a role that doesn't exist.
export const findByName = async (name: string) => {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, name));
  return role ?? null;
};
