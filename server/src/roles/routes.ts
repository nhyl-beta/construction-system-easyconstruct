import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// GET-only router (the roles catalogue is seeded, never edited over HTTP).
// IT Designer needs it to pick a role when creating/editing an account;
// Owner needs it for the read-only "who can do what" side of oversight.
router.use(authenticate, requireRole("admin", "owner", "it-designer"));

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

export default router;
