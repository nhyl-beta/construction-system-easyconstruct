// server/src/calendar/routes.ts — NEW (A2)
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { formatSuccess } from "../utils/response.js";
import { UnauthorizedError } from "../utils/errors.js";
import { getCalendarEvents } from "./service.js";
import { ALL_DOMAIN, cached } from "../cache/index.js";
import { userScope } from "../cache/scope.js";

const router = Router();
router.use(authenticate);

router.get("/events", async (req: AuthedRequest, res, next) => {
  try {
    if (!req.authUser) throw new UnauthorizedError();
    // What a user sees depends on their role and assignments, so the entry is
    // per user; any write anywhere invalidates it. 60 s.
    const actor = { id: req.authUser.id, role: req.authUser.role };
    const events = await cached("calendar", userScope(req.authUser)!, 60, () => getCalendarEvents(actor), { deps: [ALL_DOMAIN] });
    res.json(formatSuccess(events, "Calendar events retrieved"));
  } catch (err) {
    next(err);
  }
});

export default router;
