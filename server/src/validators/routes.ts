import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  forgotPasswordSchema,
  loginSchema,
  ownerRecoveryInitiateSchema,
  resetPasswordSchema,
} from "../validators/auth-validators.js";
import * as controller from "../auth/controller.js";

const router = Router();
router.post("/login", validate(loginSchema), controller.login);

// Account recovery. Both stay unauthenticated by definition — the caller is
// someone who cannot sign in.
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  controller.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  controller.resetPassword,
);

// Owner's fail-safe recovery of the IT Designer account — see the note atop
// auth/service.ts's initiateOwnerRecovery. Unlike the two routes above, this
// caller IS signed in (as Owner); it is a different account being recovered.
router.post(
  "/owner-recovery/initiate",
  authenticate,
  requireRole("owner"),
  validate(ownerRecoveryInitiateSchema),
  controller.initiateOwnerRecovery,
);
router.get(
  "/owner-recovery/inbox",
  authenticate,
  requireRole("owner"),
  controller.ownerRecoveryInbox,
);

export const authRoutes = router;
