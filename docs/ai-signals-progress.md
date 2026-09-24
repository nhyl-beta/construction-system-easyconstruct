# AI-Validation decision-support layer — progress

Branch: `feature/ai-signals`, created from `feature/project-lifecycle` @ `2946adc` (lifecycle work, groups A-L, complete).

At the start of every session: read this file and continue from the first unticked item.

## Checklist

### A. Preflight

- [x] **A1** Branch created (`feature/ai-signals` off `feature/project-lifecycle`). Baseline recorded before any change:
  - `npx tsc --noEmit -p server` — clean, 0 errors.
  - `npm --prefix server test` — 22/22 pass (all from the lifecycle work: `gates.test.ts`, `progress.test.ts`).
  - `/api/finance` mount confirmed at `server/src/app.ts:103`: `app.use("/api/finance", authenticate, financeRouter);` — already fixed by the lifecycle work's own A1, nothing to do here.
  - Commit: `568a4ec` (see below).
- [x] **A2** Verified EstimationPro.ai live, 2026-09-24-25. Both endpoints answer with **200** and a shape close to, but not identical to, the spec (see Deviations §AV-1):
  - `GET /api/v1/trades` → `{ data: { trades: [{trade, itemCount}, ...], totalItems }, meta: { source: "EstimationPro.ai Construction Cost API", url, methodology, updated, license } }`. 34 trades, 411 total items.
  - `GET /api/v1/costs?trade=concrete` → `{ data: { trade, location: "National average", multiplier: 1, itemCount, items: [{id, description, unit, low, high, typical, volatility, lastVerified, regionallyAdjusted}, ...] }, meta: {...} }`.
  - `location=Manila` query param is accepted but ignored — no PH-specific data, always returns `"National average"`, `multiplier: 1`. Fine: `region_multiplier` is nullable/defaults to 1 in the schema anyway.
  - `GET /api/v1/index` also answers (200), confirming the higher 500/day quota endpoint exists, though nothing in this build uses it yet.
  - **Not a stop condition** — proceeding to Group B on this shape.
  - Commit: `568a4ec`.
- [x] **A3** Split `FEATURES.ai` (client) into `ai` (real output) and `aiPlaceholders` (hardcoded `false`, never wired to an env var). Full surface audit and moves below. Verified: `npm --prefix client run build` succeeds (exit 0) after every move; `npx tsc --noEmit -p server` stays clean.
  - Commit: `568a4ec`.
- [x] **A4** `server/src/config/signals.ts` created with `SIGNAL_THRESHOLDS` (S-4), `SIMILARITY_FLOOR = 0.40`, `REFERENCE_CACHE_TTL_MS` (7 days), `DAILY_REQUEST_BUDGET = 80`. `server/src/config/env.ts` gained `FX_RATE_USD_PHP` (default 62.73) and `FX_RATE_AS_OF` (default "2026-09-22").
  - Commit: `568a4ec`.

**A3 surface table** (audited via a full grep of `client/src` for `FEATURES.ai`, both client and server sides):

| Surface | File | Real or placeholder | Flag now |
|---|---|---|---|
| Proposal completeness validation panel | `features/proposals/components/ProposalsRegister.tsx:129` | **Real** — renders `proposals.aiValidation`, computed by `proposals/validation.ts` (deterministic checks: title length, project existence, description length) | `ai` |
| Proposal validation table column | `pages/roles/architect/architect-proposals.tsx` (5 sites) | **Real** — same `aiValidation` data | `ai` |
| Proposal validation summary panel | `pages/roles/consultant/consultant-proposals.tsx:547` | **Real** — same data, labeled "Rule-Based Validation Summary" | `ai` |
| Header "AI · {primaryAi}" badge | `components/refine-ui/layout/header.tsx:136` | Placeholder — `primaryAi` is a static per-role string in `config/role-tab.ts`, computes nothing | `aiPlaceholders` |
| Multi-step "Generate with AI" hint | `components/ui/multi-step-page.tsx:112` | Placeholder — static hint text, no backend call | `aiPlaceholders` |
| Consultant dashboard "AI validation insights" card | `pages/roles/consultant/consultant-dashboard.tsx:225` | Placeholder — `ComingSoonCard`, explicitly "not wired to a backend yet" | `aiPlaceholders` |
| PM dashboard "AI insights" card | `pages/roles/project-manager/pm-dashboard.tsx:193` | Placeholder — `ComingSoonCard` (real `WaitingOnYouCard` already sits above it, from lifecycle group K1) | `aiPlaceholders` |
| PM workflows "AI suggestions" tab | `pages/roles/project-manager/pm-workflows.tsx:79,219` | Placeholder — card literally titled "Not yet connected" | `aiPlaceholders` |
| HR "AI HR assistant" card | `pages/roles/human-resources/hr-dashboard.tsx:428` (renders `AIInsightsCard`, defined 237-287) | Placeholder, **highest-risk of the batch** — showed a "Live" badge over `hrAIInsights`, a hardcoded array in `providers/mock-data.ts`; nothing ever computed it | `aiPlaceholders` |
| Finance expenses "AI" column + anomaly card | `pages/roles/finance/finance-expenses.tsx` (4 sites) | Placeholder — keyed off `expense.anomalyScore`, which **nothing in the codebase ever assigns a value to** (grepped client + server, zero writers) | `aiPlaceholders` |
| `useFinanceAiInsightsController` hook | `features/finance/hooks/use-finance-ai-insight.ts` | Placeholder/dead-end — `/api/finance/ai-insights` and `/api/finance/risks` are commented out server-side (`server/src/routes/finance.ts`); the hook never fetches anything regardless of the flag | `aiPlaceholders` |
| `/ai-insights` route | `App.tsx:162` | Placeholder — unconditionally redirects to `/dashboard` (this is correct now that `aiPlaceholders` is permanently false: a dead route should always bounce, not conditionally) | n/a (route itself un-gated by design; see below) |
| "AI Insights" nav entry | `providers/resources.ts` | Was un-gated (would show a nav link into a redirect-to-dashboard route). Now filtered out of the exported `resources` array unless `aiPlaceholders` is on | `aiPlaceholders` |
| `pm-ai-insights.tsx`, `shared-ai-insights.tsx` pages | `pages/roles/*/*-ai-insights.tsx` | Placeholder (`ComingSoonCard`), unreachable now that the route redirects and the nav entry is gone. Left in place, not deleted. | n/a — unreachable |
| `workflows.aiNote` | server `workflows/service.ts`, always written; UI shows it when `FEATURES.ai` on (client) | **Real** — this is the field the decision-support cost-comparison service (Group C) will start writing real citations into | `ai` |

Server-side `FEATURES.ai` sites (both real, unchanged): `proposals/service.ts` `create()` and `submit()`, computing `aiValidation` via `validateProposal()`.

## Deviations

- **AV-1 (A2):** EstimationPro.ai's actual response shape differs in two small, non-blocking ways from the prompt's assumed shape: (1) `multiplier` and `regionallyAdjusted`/`location` are fields on the **trade-level response**, not per catalog item — every item in one `/costs?trade=X` call shares the same multiplier, so `reference_snapshots.region_multiplier` is populated once per fetched batch, not computed per item; (2) items carry two extra fields not in the original spec (`lastVerified`, `regionallyAdjusted`) — harmless, will be preserved in `raw_payload` (jsonb) but not given dedicated columns. Neither difference blocks Group B; not stopping at checkpoint 1 over this.
- **AV-2 (A3):** the HR "AI HR assistant" card was the one placeholder surface that visually implied real, live output (a "Live" badge over static mock data) rather than reading as an obvious stub like the others ("Coming soon", "Not yet connected"). Moved to `aiPlaceholders` like the rest rather than deleting it, per the "hide, don't delete" rule — flagged here since it's the one a reviewer is most likely to have believed was real.
- **AV-3 (A3):** `providers/resources.ts`'s `resources` export changed from a plain array literal to a filtered one (`allResources` + a conditional `.filter`), the minimal change to stop the nav from linking to a route that only redirects away. No other resource entries were touched.

## Questions

(none yet)
