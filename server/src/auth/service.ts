import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as repo from "./repository.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors.js";
import { env } from "../config/env.js";
import { logAudit } from "../utils/audit.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  OwnerRecoveryEmail,
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

// ---------------------------------------------------------------------------
// Owner fail-safe account recovery
//
// Every other password-reset path assumes the account holder can still reach
// their own mailbox (self-service forgot-password) or that someone with
// account-management rights is doing the reset (IT Designer's admin reset —
// see users/service.ts setPassword). Neither works if the IT Designer's own
// account is the one that's locked out, since that role IS account
// management. Owner is the one role above IT Designer in practice (it can
// read everything, per role-tab.ts), so it gets a narrow, one-directional
// escape hatch: recover the IT Designer account only, with the confirmation
// link delivered to the OWNER's own registered email — never the IT
// Designer's, since that mailbox may be exactly what's unreachable.
//
// It reuses the same signed-with-the-password-hash reset token as
// requestPasswordReset/resetPassword above, so completing the flow is the
// existing POST /api/auth/reset-password — no new "finish recovery" endpoint
// needed, and the same single-use-by-construction guarantee applies.
const RECOVERABLE_ROLE = "it-designer";

// No mail transport exists in this repo (see requestPasswordReset). Rather
// than only logging to the server console, the generated link is also kept
// here as a simulated inbox so the Owner can retrieve it from the UI itself
// — this is a stand-in for real email delivery, not a persistence layer:
// entries are per-process and are expected to be replaced by a real mailer.
const ownerRecoveryInbox = new Map<number, OwnerRecoveryEmail>();

export const initiateOwnerRecovery = async (
  ownerUserId: number,
  targetUserId: number,
) => {
  const owner = await repo.findById(ownerUserId);
  if (!owner) throw new UnauthorizedError();

  const target = await repo.findById(targetUserId);
  if (!target) throw new NotFoundError("User", String(targetUserId));

  if (target.role !== RECOVERABLE_ROLE) {
    throw new ValidationError(
      "Fail-safe recovery can only be used to recover the IT Designer account.",
    );
  }

  const token = jwt.sign(
    { sub: target.id, typ: RESET_TOKEN_TYPE },
    resetSecret(target.password),
    { expiresIn: RESET_TOKEN_EXPIRES_IN },
  );

  const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  console.log(
    `[auth] owner fail-safe recovery: link for IT Designer ${target.email} delivered to owner ${owner.email}: ${resetUrl}`,
  );

  const email: OwnerRecoveryEmail = {
    to: owner.email,
    targetUserId: target.id,
    targetName: target.name,
    targetEmail: target.email,
    resetUrl,
    createdAt: new Date().toISOString(),
  };
  ownerRecoveryInbox.set(owner.id, email);

  await logAudit({
    entityType: "user",
    entityId: String(target.id),
    action: "updated",
    actor: owner.name,
    summary: `Owner fail-safe recovery: sent a password reset link for IT Designer account ${target.email} to ${owner.email}`,
  });

  return email;
};

export const getOwnerRecoveryInbox = (ownerUserId: number) =>
  ownerRecoveryInbox.get(ownerUserId) ?? null;
