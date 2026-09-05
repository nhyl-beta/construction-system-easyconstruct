import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../validators/auth-validators.js";
import * as controller from "../auth/controller.js";

const router = Router();
router.post("/login", validate(loginSchema), controller.login);

export const authRoutes = router;