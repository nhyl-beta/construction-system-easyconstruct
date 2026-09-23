// Mirrors server/src/config/features.ts. AI validation surfaces are hidden
// (not deleted) while this is off — see the lifecycle progress doc, group B.
export const FEATURES = {
  ai: import.meta.env.VITE_FEATURE_AI === "true",
} as const;
