import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as repo from "./repository.js";
import { UnauthorizedError, ValidationError } from "../utils/errors.js";
import { env } from "../config/env.js";
import { logAudit } from "../utils/audit.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from "./types.js";

const JWT_EXPIRES_IN = "8h";
const RESET_TOKEN_EXPIRES_IN = "30m";
const RESET_TOKEN_TYPE = "password-reset";
const PASSWORD_SALT_ROUNDS = 10;

// A reset token is a JWT signed with the app secret *plus the user's current
// password hash*. That makes it single-use for free: completing a reset
// changes the hash, which changes the signing key, which invalidates every
// token issued against the old one — no password_reset_tokens table, no
// cleanup job, and no window where a leaked-then-used link still works.
const resetSecret = (passwordHash: string) => `${env.JWT_SECRET}${passwordHash}`;

/**
 * Records every sign-in attempt, successful or not, into the existing audit
 * trail rather than a parallel table — audit_logs already stores
 * actor/action/summary and is already surfaced by the Security and System
 * Oversight screens, so login history lands where operators look.
 *
 * `entityType` is "auth" and `action` is "login" / "login-failed", which is
 * what the oversight panel filters on.
 */
const recordLoginAttempt = (
  email: string,
  outcome: "login" | "login-failed",
  summary: string,
  actorName?: string,
) =>
  logAudit({
    entityType: "auth",
    entityId: email,
    action: outcome,
    actor: actorName ?? email,
    summary,
  });

export const login = async (input: LoginInput) => {
  const user = await repo.findByEmail(input.email);
  if (!user) {
    await recordLoginAttempt(
      input.email,
      "login-failed",
      "Sign-in failed: no account with that email",
    );
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    await recordLoginAttempt(
      input.email,
      "login-failed",
      "Sign-in failed: incorrect password",
      user.name,
    );
    throw new UnauthorizedError("Invalid email or password");
  }

  // Deactivated accounts (IT Designer's "deactivate accounts" scope) keep
  // their row and their history but can no longer obtain a token.
  if (!user.isActive) {
    await recordLoginAttempt(
      input.email,
      "login-failed",
      "Sign-in refused: account is deactivated",
      user.name,
    );
    throw new UnauthorizedError(
      "This account has been deactivated. Contact your system administrator.",
    );
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  // The JWT is stateless with an 8h expiry, so "active session" is derived
  // from the most recent successful sign-in rather than a session table —
  // see audit-logs/repository.ts findRecentSessions.
  await recordLoginAttempt(
    input.email,
    "login",
    `Signed in as ${user.role}`,
    user.name,
  );

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
};

export const requestPasswordReset = async (input: ForgotPasswordInput) => {
  const user = await repo.findByEmail(input.email);

  // Always report success. Telling an anonymous caller whether an address is
  // registered turns this endpoint into an account-enumeration oracle.
  if (!user || !user.isActive) return;

  const token = jwt.sign(
    { sub: user.id, typ: RESET_TOKEN_TYPE },
    resetSecret(user.password),
    { expiresIn: RESET_TOKEN_EXPIRES_IN },
  );

  const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  // No mail transport is configured anywhere in this repo, so delivery is
  // logged instead of sent. Swapping this line for a real mailer is the only
  // change needed to make recovery fully self-service.
  console.log(`[auth] password reset link for ${user.email}: ${resetUrl}`);

  await logAudit({
    entityType: "user",
    entityId: String(user.id),
    action: "updated",
    actor: user.name,
    summary: `Requested a password reset link for ${user.email}`,
  });
};

export const resetPassword = async (input: ResetPasswordInput) => {
  // The user id has to be read before the signature can be checked, because
  // the signing key is derived from that user's current password hash.
  const decoded = jwt.decode(input.token);

  if (
    !decoded ||
    typeof decoded === "string" ||
    (typeof decoded.sub !== "string" && typeof decoded.sub !== "number")
  ) {
    throw new ValidationError("This reset link is invalid or has expired");
  }

  const user = await repo.findById(Number(decoded.sub));
  if (!user) throw new ValidationError("This reset link is invalid or has expired");

  let verified: jwt.JwtPayload;
  try {
    verified = jwt.verify(input.token, resetSecret(user.password)) as jwt.JwtPayload;
  } catch {
    throw new ValidationError("This reset link is invalid or has expired");
  }

  // Reject a normal session token replayed here: only tokens minted by
  // requestPasswordReset carry this claim.
  if (verified.typ !== RESET_TOKEN_TYPE) {
    throw new ValidationError("This reset link is invalid or has expired");
  }

  await repo.updatePassword(
    user.id,
    await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS),
  );

  await logAudit({
    entityType: "user",
    entityId: String(user.id),
    action: "updated",
    actor: user.name,
    summary: `Completed a password reset for ${user.email}`,
  });
};
