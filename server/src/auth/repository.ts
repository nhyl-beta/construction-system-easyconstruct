import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";
import { passwordResetTokens } from "../db/schema/password-reset-tokens.js";

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
    .set({ password, passwordChangedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
};

// ── Password reset tokens ──────────────────────────────────────────────

export const createResetToken = async (data: {
  userId: number;
  tokenHash: string;
  requestedByUserId: number;
  expiresAt: Date;
}) => {
  const [created] = await db.insert(passwordResetTokens).values(data).returning();
  return created!;
};

export const findResetToken = async (tokenHash: string) => {
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash));
  return row ?? null;
};

/** Marks one token used. False when it was already used (lost a race). */
export const consumeResetToken = async (id: number) => {
  const [row] = await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.id, id), isNull(passwordResetTokens.usedAt)))
    .returning({ id: passwordResetTokens.id });
  return !!row;
};

/** Invalidates every still-open link for the account. */
export const revokeOpenResetTokens = async (userId: number) => {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
};

export const findPasswordChangedAt = async (id: number) => {
  const [row] = await db
    .select({ passwordChangedAt: users.passwordChangedAt })
    .from(users)
    .where(eq(users.id, id));
  return row ? (row.passwordChangedAt ?? null) : undefined;
};
