// server/src/ai-validation/routes.ts — NEW (ai-signals E6)
//
// Admin-only, decision-support-only: refreshing the cached cost catalog
// never blocks anything and never runs automatically from here — the lazy
// refresh in cache.ts already covers normal use. This is a manual "do it
// now" for when someone wants fresher data without waiting for the 7-day
// TTL to lapse.
import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { formatSuccess } from "../utils/response.js";
import { db } from "../db/connection.js";
import { referenceSnapshots } from "../db/schema/ai-validation.js";
import { desc, count } from "drizzle-orm";
import { fetchTrades, fetchCostsForTrade } from "./reference-client.js";

const router = Router();
router.use(authenticate);
router.use(requireRole("admin"));

router.get("/references-status", async (_req, res, next) => {
  try {
    const [totalRow] = await db.select({ value: count() }).from(referenceSnapshots);
    const total = totalRow?.value ?? 0;
    const [newest] = await db
      .select({ fetchedAt: referenceSnapshots.fetchedAt })
      .from(referenceSnapshots)
      .orderBy(desc(referenceSnapshots.fetchedAt))
      .limit(1);
    res.json(
      formatSuccess(
        { totalItems: total, lastFetchedAt: newest?.fetchedAt?.toISOString() ?? null },
        "Reference catalog status retrieved",
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/refresh-references", async (_req, res, next) => {
  try {
    const trades = await fetchTrades();
    let itemCount = 0;
    let tradesRefreshed = 0;
    for (const trade of trades) {
      const rows = await fetchCostsForTrade(trade);
      if (rows.length > 0) {
        itemCount += rows.length;
        tradesRefreshed += 1;
      }
    }
    res.json(
      formatSuccess(
        { tradesRefreshed, tradesTotal: trades.length, itemCount },
        "Reference catalog refresh finished",
      ),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
