// AI validation (proposals/service.ts validateProposal, and every UI surface
// that reads its output) is out of scope for this pass but not deleted —
// flagged off by default so it can be turned back on without rebuilding it.
export const FEATURES = {
  ai: process.env.FEATURE_AI === "true",
} as const;
