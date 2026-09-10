import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "../validators/attendance-validators.js";

const router = Router();

router.get("/", controller.getAll);
router.post("/", validate(createAttendanceSchema), controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", validate(updateAttendanceSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
