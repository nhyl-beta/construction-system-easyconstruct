import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  generatePayrollSchema,
  updatePayrollLineSchema,
} from "../validators/payroll-validators.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("human-resources", "finance-manager", "admin", "it-designer"));

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