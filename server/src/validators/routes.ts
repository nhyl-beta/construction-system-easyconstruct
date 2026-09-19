import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
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

export const authRoutes = router;
