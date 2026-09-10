import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import {
  generatePayrollSchema,
  updatePayrollLineSchema,
} from "../validators/payroll-validators.js";

const router = Router();

// Tracksheet
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.patch("/:id", validate(updatePayrollLineSchema), controller.update);
router.delete("/:id", controller.remove);

// Generate → Gross Labor + Gross Tracking batch
router.post("/generate", validate(generatePayrollSchema), controller.generate);

// Gross Tracking
router.get("/batches/all", controller.listBatches);

export default router;
