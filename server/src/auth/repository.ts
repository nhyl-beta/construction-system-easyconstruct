import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";

export const findByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
};