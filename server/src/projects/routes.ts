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
  requireRole("project-manager", "admin", "super-admin"),
  validate(createProjectSchema),
  controller.create,
);
router.patch(
  '/:id',
  requireRole("project-manager", "admin", "super-admin"),
  validate(updateProjectSchema),
  controller.update,
);
router.delete(
  '/:id',
  requireRole("project-manager", "admin", "super-admin"),
  controller.remove,
);

export default router;