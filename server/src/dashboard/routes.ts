// server/src/dashboard/routes.ts — mounted at /api/dashboard
import { NextFunction, Response, Router } from "express";
import { authenticate, type AuthedRequest } from "../middleware/auth.js";
import { UnauthorizedError } from "../utils/errors.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
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

export default router;
