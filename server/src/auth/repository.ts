import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";

export const findByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
};

export const findById = async (id: number) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
};

export const updatePassword = async (id: number, password: string) => {
  const [updated] = await db
    .update(users)
    .set({ password, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
};
