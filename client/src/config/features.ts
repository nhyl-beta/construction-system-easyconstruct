// Mirrors server/src/config/features.ts. AI validation surfaces are hidden
// (not deleted) while this is off — see the lifecycle progress doc, group B.
export const FEATURES = {
  ai: import.meta.env.VITE_FEATURE_AI === "true",
  // Hardcoded false, never wired to an env var, and never to be turned on:
  // these are UI surfaces (a header badge, "coming soon" cards, an unused
  // AI column, a dead insights route) that show no real computed output —
  // no data source backs them, some don't even have a server endpoint.
  // `ai` above is reserved for surfaces that show genuine output (proposal
  // completeness validation, workflow aiNote, and the decision-support
  // signals layer). Turning this on would ship fabricated-looking content;
  // see docs/ai-signals-progress.md group A3 for the full surface audit.
  aiPlaceholders: false,
} as const;
