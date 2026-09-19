import { Router } from 'express';
import * as controller from "./controller.js";
import { validate }    from "../middleware/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project-validator.js";
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get ('/',    controller.getAll);
router.get ('/:id', controller.getById);
router.post(
  '/',
  requireRole("project-manager", "admin", "it-designer"),
  validate(createProjectSchema),
  controller.create,
);
// Engineer is on this list for progress reporting only. Route access is
// "who may ever PATCH"; which fields they may actually change is enforced in
// projects/service.ts assertCanUpdateProject — an Engineer PATCH carrying
// anything other than `progress` is rejected. Engineer is deliberately
// absent from POST and DELETE below: it cannot create or remove projects.
router.patch(
  '/:id',
  requireRole("project-manager", "admin", "it-designer", "engineer"),
  validate(updateProjectSchema),
  controller.update,
);
router.delete(
  '/:id',
  requireRole("project-manager", "admin", "it-designer"),
  controller.remove,
);

export default router;