import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "../validators/attendance-validators.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post(
  "/",
  requireRole("site-personnel", "admin", "it-designer"),
  validate(createAttendanceSchema),
  controller.create,
);
// Site Personnel is on this list so that clocking out works at all: the UI's
// "Clock out" button is a PATCH of the same record the worker just created
// (see client/src/features/attendance/hooks/use-attendance.ts), and without
// the role here every clock-out returned 403 while the button stayed enabled.
// Route-level access is "who may ever PATCH"; "which record, and which
// fields" is enforced in service.update via assertCanUpdateAttendance —
// Site Personnel may only close out their own open record.
router.patch(
  "/:id",
  requireRole(
    "site-personnel",
    "project-manager",
    "human-resources",
    "admin",
    "it-designer",
  ),
  validate(updateAttendanceSchema),
  controller.update,
);
router.delete(
  "/:id",
  requireRole("human-resources", "admin", "it-designer"),
  controller.remove,
);

export default router;