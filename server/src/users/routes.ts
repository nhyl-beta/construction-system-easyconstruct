import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createUserSchema,
  setUserStatusSchema,
  updateUserSchema,
} from "../validators/user-validators.js";

const router = Router();

router.use(authenticate);

// GET stays open to every authenticated role: it is the cross-role user
// picker (PM staffing, engineer assignment) and returns no sensitive columns.
router.get("/", controller.getAll);

// Account management is IT Designer's core scope in the capstone
// ("create/edit/deactivate accounts, assign permissions"). Admin and Super
// Admin are included because every other administrative write route in this
// codebase includes them. Owner is deliberately absent — its scope is
// read-only executive oversight, so it must not be able to mint accounts.
const canManageAccounts = requireRole("admin", "super-admin", "it-designer");

router.post("/", canManageAccounts, validate(createUserSchema), controller.create);
router.patch("/:id", canManageAccounts, validate(updateUserSchema), controller.update);
router.patch(
  "/:id/status",
  canManageAccounts,
  validate(setUserStatusSchema),
  controller.setStatus,
);

export default router;
