// Thresholds for the decision-support signal layer (server/src/signals/*).
// Every constant here is cited by name in docs/ai-signals-progress.md's
// checklist (S-4) — change them here, not in the rule files, so the numbers
// stay in one place.

export const SIGNAL_THRESHOLDS = {
  costVariance: { warnPct: 0.15, criticalPct: 0.30 },
  cumulativeChange: { warnPct: 0.10, criticalPct: 0.20 },
  burnVsProgress: { warnPoints: 20, criticalPoints: 35 },
  issueRecurrence: { warnCount: 3, criticalCount: 5, windowDays: 30 },
  stalledStage: { warnHours: 48, criticalHours: 120 },
} as const;

// Dice-coefficient floor below which a cost-catalog match is discarded
// (matcher.ts bestMatch) — see S-3.
export const SIMILARITY_FLOOR = 0.40;

// cache.ts: how long cached reference_snapshots rows are trusted before a
// lazy refresh is attempted.
export const REFERENCE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// reference-client.ts: EstimationPro.ai's documented quota is 100 req/day
// (500 for /index). This is a margin under that so a shared dev environment
// making unrelated calls doesn't tip the account over the real limit.
export const DAILY_REQUEST_BUDGET = 80;
