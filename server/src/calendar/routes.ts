// server/src/calendar/routes.ts — NEW (A2)
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { formatSuccess } from "../utils/response.js";
import { UnauthorizedError } from "../utils/errors.js";
import { getCalendarEvents } from "./service.js";

const router = Router();
router.use(authenticate);

router.get("/events", async (req: AuthedRequest, res, next) => {
  try {
    if (!req.authUser) throw new UnauthorizedError();
    const events = await getCalendarEvents({ id: req.authUser.id, role: req.authUser.role });
    res.json(formatSuccess(events, "Calendar events retrieved"));
  } catch (err) {
    next(err);
  }
});

export default router;
