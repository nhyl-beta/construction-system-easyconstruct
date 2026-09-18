import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
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
router.post("/", validate(createRequirementSchema), controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", validate(updateRequirementSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;