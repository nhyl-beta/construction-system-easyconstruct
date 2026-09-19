import { Router } from 'express';
import * as controller from "./controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();
// Owner's capstone scope is "system oversight and audit-log viewing" and IT
// Designer's is "system monitoring"; this router is GET-only, so adding them
// grants read of the audit trail and nothing else.
router.use(authenticate, requireRole("admin", "super-admin", "owner", "it-designer"));
router.get('/', controller.getAll);

export default router;
