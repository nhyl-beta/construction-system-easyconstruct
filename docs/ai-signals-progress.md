# AI-Validation decision-support layer — progress

Branch: `dev-ai` (created as `feature/ai-signals` off `feature/project-lifecycle` @ `2946adc`; renamed to `dev-ai` outside this work, now tracks `origin/dev-ai` — same commit history, name only).

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

### B. Reference data

- [x] **B1** `reference_snapshots` and `validation_results` tables added to `server/src/db/schema/ai-validation.ts` plus matching idempotent SQL in `ensure-demo-schema.ts`. `reference_snapshots` unique on `(source, source_item_id)` for upserting. Verified: ran `ensure-demo-schema.ts` live, queried `information_schema.columns` for both tables — all columns present.
- [x] **B2** `workflow_line_items` gained nullable `quantity`/`unit`, mirrored in the Drizzle schema, `ensure-demo-schema.ts`, `validators/workflow-validators.ts` (`workflowLineItemSchema`), `workflows/types.ts` (`WorkflowLineItemInput`/`WorkflowLineItemRecord`), and threaded through `workflows/service.ts`'s `insertLineItems` call. Verified: `information_schema.columns` shows both new columns on `workflow_line_items`.
- [x] **B3** `server/src/ai-validation/reference-client.ts`: `fetchTrades()`/`fetchCostsForTrade(trade)`, 5s `AbortController` timeout, in-memory daily counter capped at `DAILY_REQUEST_BUDGET` (80), upsert via `onConflictDoUpdate`, never throws (catches and logs, returns `[]`/empty array on any failure). Verified live (see B5).
- [x] **B4** `server/src/ai-validation/cache.ts`: `getReferenceItems()` reads cached rows, triggers exactly one lazy refresh (deduplicated via a shared in-flight promise) when empty or the newest `fetchedAt` is older than the 7-day TTL, falls back to stale rows if the refresh yields nothing.
- [x] **B5** `server/src/scripts/seed-reference-data.ts` + `npm run ai:seed-references`. **Run live end-to-end**: pulled all 34 trades, 411 items, zero failures on the second run. Verified via direct SQL: `SELECT count(*) FROM reference_snapshots` → 411; spot-checked `concrete` trade's 13 rows for correct `low_usd`/`typical_usd`/`high_usd`/`region_multiplier` (`1.000`, matching the API's `multiplier: 1`) and description length.
  - **Real bug found and fixed while running this live**: some EstimationPro.ai item descriptions run past 500 characters (e.g. the `addition` trade's `master-suite-addition-per-sqft`/`bathroom-addition-per-sqft` items), overflowing the original `varchar(255)` `reference_snapshots.description` column with a Postgres `22001` error. Fixed by widening the column to `text` in both the Drizzle schema and `ensure-demo-schema.ts` (with an `ALTER COLUMN ... TYPE text` for the table already created once with the narrower type) — logged as AV-4.
  - Commit: `77a8bf7`.

### C. Cost comparison

- [x] **C1** `server/src/ai-validation/units.ts`: `normalizeUnit`/`convertQuantity`, alias table, exact factors only. Tests: `units.test.ts`, 15 cases (every alias family, every conversion factor, reversibility, cross-family and unrecognized-unit rejection). **Real bug caught by the tests**: the alias for "ln ft"/"linear ft" was keyed wrong (`linft` instead of the actual cleaned key `lnft`/`linearft`) — fixed, and cross-checked against every unit string actually present in the seeded catalog (see below).
- [x] **C2** `server/src/ai-validation/matcher.ts`: `tokenize`/`dice`/`bestMatch`, deterministic lower-id tie-break. Tests: `matcher.test.ts`, 11 cases (tokenization incl. numeric-prefixed tokens like "12mm", Dice arithmetic, the 0.40 floor with a nonsense "asdf 123" input, tie-break determinism).
- [x] **C3** `server/src/ai-validation/cost.ts`: `compareLineItem`. Tests: `cost.test.ts`, 9 cases, including the Field Guide's worked trace (typical $12,850 → mid ₱806,081 (well, ₱806,080.50 stored, ₱806,081 displayed) → **+5.4%** variance → `within-range` — numbers match the guide's example exactly) plus above/below-typical and all four no-match reasons (no quantity, no unit, no match, unconvertible units) with the "no range shown" honesty rule asserted directly.
- [x] **C4** `server/src/ai-validation/service.ts`: `validateWorkflowLineItems(workflowId)` — persists a `validation_results` row per line (including no-match), writes a ≤500-char summary to `workflows.aiNote`, whole body in try/catch. Verified live (see below).
- [x] **C5** Wired into `workflows/service.ts createWorkflow`, after `insertLineItems`, gated by `FEATURES.ai && template.name in {"Budget Change Request","Change Order Request"}`. Awaited but caught, never fails workflow creation.
- [x] **C6** `initiate-workflow-dialog.tsx`: added Quantity + Unit (select, from `units.ts`'s exact-conversion set) to each line-item row; helper text "Add quantity and unit to compare against market cost." shown only when `FEATURES.ai` is on; fields themselves always shown (plain data, not AI-gated).
- [x] **C7** `attachStages` attaches each line item's latest `validation_results` row (via new `ai-validation/repository.ts findLatestByLineItemIds`) when `FEATURES.ai` is on; new `ai-validation/types.ts LineItemValidationSummary`; client `workflow.types.ts` updated to match (`WorkflowLineItem.validation`).
- [x] **C8** 🟡 `POST /api/workflows/:id/revalidate` (finance-manager, admin) + a "Re-check market cost" button on Finance Impact Review (`finance-impact-review.tsx`), flag-gated, reloads the list on success, swallows failure silently (decision support, not worth a page-level error banner).
  - Commit: `77a8bf7`.

**Live verification (checkpoint 2 evidence)**: ran the dev server with `FEATURE_AI=true`, logged in as the demo engineer, temporarily flipped `DEMO-01` to Construction, and created a real "Budget Change Request" workflow with three line items — one matchable (128.5 lf of "Rebar installation, #4 bar" against the seeded catalog's "Rebar #4 (1/2 inch)"), one with the same match but a wildly inflated amount, and one with no quantity at all. Actual server response:
  - Matched line → `verdict: "above-typical"`, `basisSummary: "Matched 'Rebar #4 (1/2 inch)' (score 0.44) · EstimationPro.ai, fetched 2026-09-24 · ₱62.73/$1 as of 2026-09-22 · reference ₱3,224–₱8,061 (typical ₱5,240) · submitted ₱850,000 · +16122.9%."` — real citation, real numbers, correctly flagged as far above typical (the test amount was deliberately unrealistic to force the branch).
  - No-quantity line → `verdict: "no-match"`, `basisSummary: "No comparable reference — line has no quantity."`, no range shown.
  - `workflows.aiNote` on the created workflow: `"2 of 3 line(s) compared to EstimationPro.ai: 2 above typical (+95328.6%); 1 no-match (line has no quantity)."`
  - Test workflow and its validation_results rows deleted afterward (cascade), `DEMO-01` restored to `Archived`, dev server stopped.

### D. Signal layer

- [x] **D1** `server/src/signals/types.ts`: `Signal`, `SignalSource`, `SignalContext`, `SignalRule` per spec 4.1 — `Signal` deliberately mirrors `GateCheck` minus `passed`.
- [x] **D2** `lifecycle/repository.ts loadSnapshot` gained `validationResults` (this project's rows from `validation_results`, scoped by the column that's already there) and `issuePrecedents` (up to 3 most-recent `Resolved` issues with non-empty `resolutionNotes`, per open category, from **any** project — only `issueCode`/`title`/`category`/`resolutionNotes`/`updatedAt` selected, never another project's commercial data). Both fields added to `emptySnapshot()` in `gates.test.ts` and `progress.test.ts`.
- [x] **D3** `signals/cost-variance.ts` — reads `validationResults` already on the snapshot (no DB/network access of its own); fires only for `above-typical`/`below-typical` verdicts on workflows that are `active` or finished within 30 days; `within-range`/`no-match` raise nothing (they only show on the line-item badge, per S-7/E4).
- [x] **D4** `signals/cumulative-change-impact.ts`.
- [x] **D5** `signals/burn-vs-progress.ts` — deliberately uses task completion (`s.tasks`), not `projects.progress`, as the completion side, since progress includes the Construction band's 30% offset.
- [x] **D6** `signals/issue-recurrence.ts` — recurrence (warn/critical) and precedent (info) in one rule file, since they share the same per-category grouping; never restates K3 (adds *specific category* + *duration/precedent*, not just "issues exist").
- [x] **D7** `signals/stalled-stage.ts` — adds *duration* on top of K4's "workflow exists"; a `revision-required` stage is attributed to the workflow's own stage-1 role (the initiator who must fix it), not the reviewer who sent it back.
- [x] **D8** `signals/index.ts`: `runSignals` (pure, testable, per-rule `try/catch` so one broken rule doesn't silence the others, sorts critical→warn→info) and `evaluateSignals` (flag-gated, `[]` when `FEATURES.ai` is off).
- [x] **D9** `signals/signals.test.ts` — 26 tests: every rule's warn/critical thresholds and silence conditions, the Field Guide's exact numbers (₱5.32M/₱4.50M → +18.2% warn; 68%/40% → 28-point warn), phase filtering (a Proposal-phase project gets no burn signal), a quiet project yielding `[]`, rule isolation (a throwing rule loses only itself), severity sorting, every signal's `detail` containing a digit, and the flag returning `[]` when off. **All 84 passed on the first run** — no bugs found in this group (unlike B/C, where live seeding and unit tests each caught a real bug).
- [x] **D10** `lifecycle/boundary.test.ts` — reads the actual source of `gates.ts` (asserts zero imports from `../signals`/`../ai-validation`) and `service.ts` (asserts at most one such import, and only `evaluateSignals` from `../signals/index.js`). Written now, before Group E adds that one import, so it locks in the boundary from the start rather than retrofitting it.
  - Commit: `09f012b`.

## Deviations

- **AV-1 (A2):** EstimationPro.ai's actual response shape differs in two small, non-blocking ways from the prompt's assumed shape: (1) `multiplier` and `regionallyAdjusted`/`location` are fields on the **trade-level response**, not per catalog item — every item in one `/costs?trade=X` call shares the same multiplier, so `reference_snapshots.region_multiplier` is populated once per fetched batch, not computed per item; (2) items carry two extra fields not in the original spec (`lastVerified`, `regionallyAdjusted`) — harmless, will be preserved in `raw_payload` (jsonb) but not given dedicated columns. Neither difference blocks Group B; not stopping at checkpoint 1 over this.
- **AV-2 (A3):** the HR "AI HR assistant" card was the one placeholder surface that visually implied real, live output (a "Live" badge over static mock data) rather than reading as an obvious stub like the others ("Coming soon", "Not yet connected"). Moved to `aiPlaceholders` like the rest rather than deleting it, per the "hide, don't delete" rule — flagged here since it's the one a reviewer is most likely to have believed was real.
- **AV-3 (A3):** `providers/resources.ts`'s `resources` export changed from a plain array literal to a filtered one (`allResources` + a conditional `.filter`), the minimal change to stop the nav from linking to a route that only redirects away. No other resource entries were touched.
- **AV-4 (B1/B5):** `reference_snapshots.description` was originally `varchar(255)` per the spec's implied shape; live data broke that (some EstimationPro.ai descriptions exceed 500 characters). Changed to `text`, no length cap — these are read-only cached catalog values, not free-form user input needing a bound.
- **AV-5 (C8):** implemented the 🟡 should-have C8 (revalidate endpoint + button) during Group C rather than deferring it, since the service it calls (`validateWorkflowLineItems`) already existed from C4 and the marginal cost was small — noted here since the checklist's own priority marking suggested it was optional.

## Queued UI/UX fixes (user-reported, out of scope for AI-signals — pick up after Group L/Checkpoint 4)

Reported by the user 2026-09-25, not part of the AI-validation decision-support spec. Logged here so they aren't lost, not yet started. Located by a quick grep, not a full read — verify before fixing.

- [ ] **Q1** Notification overflow: with many notifications, the dropdown needs pagination or an infinite-scroll/"load more" instead of one long list. Likely `client/src/components/notifications/notification-bell.tsx`.
- [ ] **Q2** Consultant proposal review (Design Approval step): no visible affordance for what to click to approve — needs a clearer call-to-action/button styling. Likely `client/src/pages/roles/consultant/consultant-design-reviews.tsx`.
- [ ] **Q3** Project creation map: scrolling up on the create-project form causes the map to overlap the page header (a z-index/stacking-context issue). Likely `client/src/components/maps/location-map-picker.tsx`, used from the PM project-create page.
- [ ] **Q4** Finance approvals: creating a budget change should put a red badge/dot on the approvals nav entry or bell to signal something is pending review. Likely ties into `client/src/pages/roles/finance/finance-approvals.tsx` and the sidebar/nav badge pattern (check how other pending-count badges are done, e.g. notification-bell's unread count).
- [ ] **Q5** No visible interaction affordance for a PM to approve a Final Inspection report during Closeout — same "not obviously clickable" class of issue as Q2. Location not yet pinned down precisely; candidates are the `ProjectLifecyclePanel`/`CloseoutSummaryCard` (`client/src/features/lifecycle/components/`) or a shared engineering-reports view (`client/src/pages/roles/shared/shared-engineer.tsx`) — needs a proper look before fixing.
- [ ] **Q6** Payroll computation interactions are broken/need fixing on the finance side — vague as reported, needs reproduction first. Candidates: `client/src/pages/roles/finance/finance-payroll-review.tsx`, `finance-dashboard.tsx`, `finance-reports.tsx`.

## Questions

(none yet)
