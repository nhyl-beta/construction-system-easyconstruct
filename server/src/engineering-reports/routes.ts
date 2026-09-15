import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import {
  createEngineeringReportSchema,
  updateEngineeringReportSchema,
} from "../validators/engineering-reports-validators.js";

const router = Router();

router.get("/", controller.getAll);
router.post("/", validate(createEngineeringReportSchema), controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", validate(updateEngineeringReportSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;