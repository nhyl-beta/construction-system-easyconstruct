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
  requireRole("site-personnel", "admin", "super-admin"),
  validate(createAttendanceSchema),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("project-manager", "human-resources", "admin", "super-admin"),
  validate(updateAttendanceSchema),
  controller.update,
);
router.delete(
  "/:id",
  requireRole("human-resources", "admin", "super-admin"),
  controller.remove,
);

export default router;