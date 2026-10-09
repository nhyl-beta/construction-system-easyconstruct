// server/src/dashboard/routes.ts — mounted at /api/dashboard
import { NextFunction, Response, Router } from "express";
import { authenticate, type AuthedRequest } from "../middleware/auth.js";
import { UnauthorizedError } from "../utils/errors.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import { workforceBoard } from "../hr/aggregates.js";
import { ALL_DOMAIN, cached } from "../cache/index.js";
import { visibilityScope } from "../cache/scope.js";

const router = Router();
router.use(authenticate);

// Role-aware: the caller's own role (from the token) decides which dashboard
// summary is built, and every figure is scoped to what that role may see.
router.get("/summary", async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.authUser) throw new UnauthorizedError("Not signed in");
    // 45 s, keyed by who may share the result (see cache/scope.ts) and
    // invalidated by any write anywhere (the `all` domain).
    const scope = visibilityScope(req.authUser);
    const load = () => service.getSummary(req.authUser!);
    const data = scope ? await cached("dashboard", scope, 45, load, { deps: [ALL_DOMAIN] }) : await load();
    res.json(formatSuccess(data, "Dashboard summary retrieved"));
  } catch (err) {
    next(err);
  }
});

// HR "Workforce reporting" board for an optional date range: counts by status,
// department, site and day, in SQL. Same for every caller. 30 s.
router.get("/workforce/board", async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
    const from = date(req.query.from);
    const to = date(req.query.to);
    const data = await cached("attendance", "all", 30, () => workforceBoard(from, to), {
      query: { from, to },
      deps: ["employees"],
    });
    res.json(formatSuccess(data, "Workforce board retrieved"));
  } catch (err) {
    next(err);
  }
});

// The workforce figures on their own (the HR dashboard, the admin "Workforce
// snapshot" card): same for every caller, so one shared entry. 30 s.
router.get("/workforce", async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await cached("attendance", "all", 30, () => service.getWorkforce(), { deps: ["employees"] });
    res.json(formatSuccess(data, "Workforce summary retrieved"));
  } catch (err) {
    next(err);
  }
});

export default router;
