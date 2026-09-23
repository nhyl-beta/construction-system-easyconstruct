import { NextFunction, Request, Response, Router } from 'express';
import * as controller from "./controller.js";
import { validate }    from "../middleware/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project-validator.js";
import { authenticate, requireRole } from '../middleware/auth.js';
import { ValidationError } from "../utils/errors.js";
import lifecycleRoutes from "../lifecycle/routes.js";

const router = Router();

// updateProjectSchema.omit()s status/progress/statusTone, which would
// otherwise mean a client that sends them just has them silently stripped —
// not rejected. Checked here, before validate() runs, so the caller actually
// finds out those fields are lifecycle-owned instead of wondering why their
// status change didn't stick.
const rejectLifecycleFields = (req: Request, _res: Response, next: NextFunction) => {
  const body = req.body as Record<string, unknown>;
  const disallowed = ["status", "progress", "statusTone"].filter((k) => k in body);
  if (disallowed.length > 0) {
    return next(
      new ValidationError(
        `${disallowed.join(", ")} cannot be set via PATCH /projects/:id — use POST /projects/:id/lifecycle/advance (and hold/resume/cancel/archive) instead.`,
      ),
    );
  }
  next();
};

router.use(authenticate);

router.get ('/',    controller.getAll);
router.get ('/:id', controller.getById);
router.post(
  '/',
  requireRole("project-manager", "admin", "it-designer"),
  validate(createProjectSchema),
  controller.create,
);
// Engineer used to be on this list for progress reporting — that's now
// exclusively a lifecycle-computed value (Construction progress = completed
// tasks ÷ total tasks, see lifecycle/service.ts computeProgress), so an
// Engineer has no field left on this route to PATCH, and assertCanUpdateProject's
// engineer branch below is unreachable and removed.
router.patch(
  '/:id',
  requireRole("project-manager", "admin", "it-designer"),
  rejectLifecycleFields,
  validate(updateProjectSchema),
  controller.update,
);
router.delete(
  '/:id',
  requireRole("project-manager", "admin", "it-designer"),
  controller.remove,
);

router.use('/:id/lifecycle', lifecycleRoutes);

export default router;