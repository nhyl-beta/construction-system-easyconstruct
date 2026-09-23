import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  createRequirementSchema,
  updateRequirementSchema,
} from "../validators/requirement-validators.js";

const router = Router();

// Every other module mounts authenticate at the router level; requirements
// was the one that didn't, leaving create/update/delete open to unauthenticated
// callers.
router.use(authenticate);

router.get("/", controller.getAll);
router.post(
  "/",
  requireRole("engineer", "admin"),
  validate(createRequirementSchema),
  controller.create,
);
router.get("/:id", controller.getById);
// project-manager is here to decide (Approved/Rejected) — the route only
// says who may ever PATCH; which status values they may set is enforced in
// requirements/service.ts assertCanSetStatus.
router.patch(
  "/:id",
  requireRole("engineer", "admin", "project-manager"),
  validate(updateRequirementSchema),
  controller.update,
);
router.delete("/:id", requireRole("engineer", "admin"), controller.remove);

export default router;