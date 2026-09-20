// server/src/milestones/routes.ts — NEW
import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { createMilestoneSchema, updateMilestoneSchema } from "../validators/milestone-validators.js";

const router = Router();

router.use(authenticate);

// Read is open to every authenticated role, same as projects/workflows —
// a milestone is part of "the details of a project", which every role that
// can see the project at all should be able to see.
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// Writes are the Project Manager's, mirroring projects/routes.ts exactly
// (project-manager, admin, it-designer) — a milestone belongs to the same
// record a PM already owns and edits.
const canManageMilestones = requireRole("project-manager", "admin", "it-designer");

router.post("/", canManageMilestones, validate(createMilestoneSchema), controller.create);
router.patch("/:id", canManageMilestones, validate(updateMilestoneSchema), controller.update);
router.delete("/:id", canManageMilestones, controller.remove);

export default router;
