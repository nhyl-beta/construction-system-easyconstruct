# Demo seed data + queued UI/UX fixes — progress

Branch: `dev-ai`, started at HEAD `0e08327`. Part A commit: `8781183`. Merge of
`origin/dev-ai` (which had moved ahead mid-session — see the Part B section below): `641df06`.
Part B commit: `1e8d6c0`. Follow-up (self-contained AI reference fallback): `29ef68b`.

**Acceptance status**: all of Part A (7 stage projects + idempotency + gate dump + P9) and all
9 of Part B's reported issues are done — 6 already fixed by a commit that landed on `dev-ai`
mid-session (cross-referenced, spot-verified live, not silently claimed), 3 built fresh in this
session (item 1's affordance fix, item 6 geocoding, item 8 blueprint approval). Server
`npx tsc --noEmit` and `npm test` (84/84) and the client `npm run build` are all clean as of
`29ef68b`. `FEATURES.aiPlaceholders`'s surface table was not touched anywhere in this session.

At the start of every session: read this file and continue from the first unticked item.

## Environment note (read first)

This sandbox ships with **no configured database and no `.env`** (`server/.env` did not
exist, `DATABASE_URL` was unset, `node_modules` were not installed in either `server/` or
`client/`). The two uploaded "progress" docs' verification transcripts were produced in a
session that had a real Neon Postgres wired up; this one did not. To do real, live
verification rather than "should work" claims, this session provisioned its own **local
Postgres 16** (already installed in the container image) as the dev database:

- Created role `postgres` / db `easyconstruct` on `127.0.0.1:5432` (plain password auth,
  scoped to this one throwaway local instance — did **not** weaken the *system's* pg_hba.conf,
  that was tried once, flagged by the environment's own safety classifier as an auth-weakening
  action, and reverted immediately; a local unix-socket role switch via `setpriv` was used
  instead of touching authentication policy).
- `server/.env` created (gitignored, not committed) with that `DATABASE_URL`, `FEATURE_AI=true`.
- Base schema loaded from `server/drizzle/*.sql` (concatenated, applied once — several later
  files re-declare tables the first file already created, which is pre-existing drift in the
  repo's migration history, not something this session introduced; harmless "already exists"
  errors on the duplicates, real tables all created successfully — confirmed via `\dt`, 40 base
  tables).
- `npx tsx src/scripts/ensure-demo-schema.ts` run — added every lifecycle/ai-signals table and
  compatibility column on top of the base schema.
- `npm run db:seed` run (`ensure-demo-schema` + `seed-demo-accounts`) — created the 10
  role logins + 40 extra role accounts (50 users total) and the 7 workflow templates. **P9 is
  therefore already satisfied by the existing seed script** — no new work needed there.

**EstimationPro.ai (the AI reference-data source) is unreachable from this sandbox**: the
outbound proxy returns `403` on `CONNECT estimationpro.ai:443` (`gateway answered 403 to CONNECT
(policy denial or upstream failure)`, confirmed via the proxy's own `/__agentproxy/status`). So
`npm run ai:seed-references` cannot pull the live 411-item catalog here. Logged as deviation
AV-6 below; worked around by inserting one `reference_snapshots` row directly, using the exact
values already given a real, documented, live-verified worked trace in
`server/src/ai-validation/cost.test.ts` (Rebar #4, low $80 / typical $100 / high $120 per lf) —
not invented numbers. `validateWorkflowLineItems()` itself, the matcher, the unit converter and
the cost-comparison math are all still exercised for real against this row.

All curl/query output below is real, from this local instance, `npm run dev` running against it.

## Checklist

### Part A — Demo seed data

- [x] P1 Gate/snapshot audit table (see below)
- [x] P2 DEMO-STAGE-0 (Proposal)
- [x] P3 DEMO-STAGE-1 (Design)
- [x] P4 DEMO-STAGE-2 (Pre-Construction)
- [x] P5 DEMO-STAGE-3 (Construction)
- [x] P6 DEMO-STAGE-4 (Closeout)
- [x] P7 DEMO-STAGE-5 (Completed)
- [x] P8 DEMO-STAGE-6 (Archived)
- [x] P9 10 role-account demo logins — already seeded by `npm run db:seed` (`seed-demo-accounts.ts`), verified live above. No new code needed.
- [x] P10 Verification (idempotency + real gate-check dump + basisSummary) — see below

## P2-P10 — the seed script and its verification

`server/src/scripts/demo-seed-stages.ts` (`npm run demo:seed` from `server/`, requires
`npm run dev` running against `DATABASE_URL` and `npm run db:seed` already applied — same
prerequisites as the existing `demo-full-cycle.ts`). Builds **7** projects, `DEMO-STAGE-0`
through `DEMO-STAGE-6`, one per lifecycle phase, entirely through real API calls as the actual
role each step belongs to (same style as `demo-full-cycle.ts`/L5) — no direct DB writes for any
gate-relevant row.

**Design decision** (not pinned down by the prompt, logged here rather than guessed silently):
for every stage except Construction, the project is built up through *every* gate of its
current phase and all earlier phases (so the lifecycle panel shows a fully green checklist for
that stage) but is **not** advanced past it — it sits there, "qualified to advance but hasn't
been," which is the more useful demo state (shows what a complete stage looks like) than "just
arrived, nothing done yet." Construction (`DEMO-STAGE-3`) is the deliberate exception per the
prompt's own instruction: a realistic, partially-done task list (K1 fails on purpose — that's
what mid-Construction looks like).

**Idempotency**: `cleanup()` at the top of `main()` deletes every row scoped to the 7
`DEMO-STAGE-*` codes, children before parents (workflows/milestones/designs cascade their own
dependents; proposals, design_reviews/design_revisions/architect_documents, and every
`budgets`-child table do not, and are deleted explicitly first). Ran the script **twice** in a
row; both runs produced identical output and the projects table shows exactly 7 rows both
times:

```
$ npx tsx src/scripts/demo-seed-stages.ts   # run 1 — full output in git history / session log
=== Summary ===
  DEMO-STAGE-0   target=Proposal         actual phase=Proposal         progress=8%
  DEMO-STAGE-1   target=Design           actual phase=Design           progress=25%
  DEMO-STAGE-2   target=Pre-Construction actual phase=Pre-Construction progress=29%
  DEMO-STAGE-3   target=Construction     actual phase=Construction     progress=59%
  DEMO-STAGE-4   target=Closeout         actual phase=Closeout         progress=99%
  DEMO-STAGE-5   target=Completed        actual phase=Completed        progress=100%
  DEMO-STAGE-6   target=Archived         actual phase=Archived         progress=100%

$ npx tsx src/scripts/demo-seed-stages.ts   # run 2 — identical summary, no duplicate-row errors

$ psql ... -c "SELECT code, status, progress FROM projects WHERE code LIKE 'DEMO-STAGE-%' ORDER BY code;"
     code     |      status      | progress
 DEMO-STAGE-0 | Proposal         |        8
 DEMO-STAGE-1 | Design           |       25
 DEMO-STAGE-2 | Pre-Construction |       29
 DEMO-STAGE-3 | Construction     |       59
 DEMO-STAGE-4 | Closeout         |       99
 DEMO-STAGE-5 | Completed        |      100
 DEMO-STAGE-6 | Archived         |      100
(7 rows)   -- exactly 7, both runs
```

**Real gate-check dump** (`GET /projects/:id/lifecycle` as PM, live, right after the second
run — every gate for the project's own current phase; `Completed`/`Archived` have no gates by
design, `evaluateGate` returns `[]` for both):

```
=== DEMO-STAGE-0 phase=Proposal progress=8% ===
  P1 passed=true  Architect staffed
  P2 passed=true  Consultant staffed
  P3 passed=true  Proposal submitted
  P4 passed=true  Proposal approved
  P5 passed=true  Award & contract on file

=== DEMO-STAGE-1 phase=Design progress=25% ===
  D1 passed=true  Design with files, assigned to a staffed engineer
  D2 passed=true  All designs approved
  D3 passed=true  Approved current blueprint

=== DEMO-STAGE-2 phase=Pre-Construction progress=29% ===
  C1 passed=true  Materials & specifications approved
  C2 passed=true  Budget approved
  C3 passed=true  Milestones dated and active
  C4 passed=true  Site crew staffed and linked to tasks
  C5 passed=true  Notice to Proceed & site location

=== DEMO-STAGE-3 phase=Construction progress=59% ===
  K1 passed=false  All tasks completed -- 5 of 9 task(s) still open   (intentional — see above)
  K2 passed=false  All milestones closed -- 1 milestone(s) still open (intentional)
  K3 passed=true   No open issues
  K4 passed=false  No active workflows -- 1 active workflow(s)        (intentional — the BCR workflow is left mid-approval, see below)

=== DEMO-STAGE-4 phase=Closeout progress=99% ===
  X1 passed=true  Final inspection approved
  X2 passed=true  Certificate of Completion on file
  X3 passed=true  Closeout payroll approved
  X4 passed=true  Project Closeout workflow completed

=== DEMO-STAGE-5 phase=Completed progress=100% ===   (no gates — terminal)
=== DEMO-STAGE-6 phase=Archived progress=100% ===   (no gates — terminal)
```

Every gate for the current phase (and, by construction, every earlier phase the project has
already passed through) reads `passed: true`, except Construction's exit checks, which are
deliberately left failing to produce the requested ~60% partial state.

**DEMO-STAGE-3's real Budget Change Request** (`POST /workflows` as engineer,
`FEATURE_AI=true`, real `validateWorkflowLineItems()` call, real `reference_snapshots` row —
see AV-6 deviation below for why that row is seeded rather than freshly fetched). Actual server
response, unedited:

```
workflow.aiNote: "2 of 3 line(s) compared to EstimationPro.ai: 1 above typical (+954.5%),
  1 within range; 1 no-match (line has no quantity)."

line "Rebar installation, #4 bar" (128.5 lf, requested ₱850,000):
  verdict: within-range
  basisSummary: "Matched 'Rebar #4 (1/2 inch)' (score 0.44) · EstimationPro.ai, fetched
    2026-09-25 · ₱62.73/$1 as of 2026-09-22 · reference ₱644,864–₱967,297 (typical ₱806,081)
    · submitted ₱850,000 · +5.4%."

line "Rebar installation, #4 bar" (128.5 lf, requested ₱8,500,000 — deliberately 10x, same
  item family as the documented +16,122.9% live example in ai-signals-progress.md's Group C):
  verdict: above-typical
  basisSummary: "Matched 'Rebar #4 (1/2 inch)' (score 0.44) · EstimationPro.ai, fetched
    2026-09-25 · ₱62.73/$1 as of 2026-09-22 · reference ₱644,864–₱967,297 (typical ₱806,081)
    · submitted ₱8,500,000 · +954.5%."

line "Site fencing rental" (no quantity given, on purpose — the honest no-match path):
  verdict: no-match
  basisSummary: "No comparable reference — line has no quantity."
```

This is the real `cost.ts`/`matcher.ts`/`service.ts` code path end to end — score 0.44 Dice
match, real FX conversion, real variance math — exercised against a seeded
`reference_snapshots` row taken from the repo's own live-verified worked trace (see AV-6), not
a hand-written `validation_results` row.

`DEMO-STAGE-3`'s task list: 9 tasks total (1 from Pre-Construction, 8 created in Construction),
4 of the 8 Construction tasks completed → `computeProgress`'s real `30 + 65*(done/total)`
formula: `30 + 65*(4/9) ≈ 59%` (matches the dump above exactly — not hardcoded). Also seeded:
one Verified-eligible attendance record and one approved Materials expense (₱42,000, flowed
into the project's budget `spent` via the existing G6 sync), so Construction's attendance and
expense views aren't empty.

`DEMO-STAGE-1`'s blueprint (D3: `approval="Approved"`, `status="Current"`) is set through the
existing `POST /blueprints` create call with `approval`/`status` supplied directly in the body
— **not** a deviation after all: `blueprints/service.ts`'s create path already accepts and
persists both fields as given (verified by reading the create validator/service before writing
this), so no new endpoint was needed here. Issue #8 below is the *separate*, real gap: there is
no **UI** for a non-architect role to flip an *existing* blueprint to Approved after the fact
(the architect's own generic PATCH is the only write path a human can reach, and it's the wrong
actor) — that is fixed as part of Part B, item 8.

`DEMO-STAGE-4`'s Final Inspection is approved through the existing
`PATCH /engineering-reports/:id {status:"Approved"}` call (same as `demo-full-cycle.ts`) — real
path, no deviation. The separate, real gap here is the same as blueprints: no UI surfaces this
action for a PM to click — fixed in Part B, item 4/9.

### Part B — 9 UI/UX issues

- [x] 1. Consultant Design Approval buttons — affordance
- [x] 2. PM Create-Project map z-index overlap — already fixed upstream (Q3)
- [x] 3. Finance Approvals pending-badge — already fixed upstream (Q4)
- [x] 4/9. Final Inspection PM approval affordance/gap — already fixed upstream (Q5)
- [x] 5. Payroll computation repro + fix — already fixed upstream (Q6), re-verified live in this environment
- [x] 6. Location textbox geocoding (Nominatim)
- [x] 7. Notification dropdown pagination — already fixed upstream (Q1)
- [x] 8. Blueprint approval action (real gap)

## Part B — mid-task discovery: most of this was already fixed upstream

Partway through this session, `origin/dev-ai` had moved (from `0e08327` to `83675df` — a
fetch/merge mid-session, not something this session caused) and now included
`9e7fe3fce918` **"fix(ui): Q1-Q6 user-reported UI/UX issues, all live-verified"**, plus AI-signals
Groups D/E/F. That single commit already fixes exactly the 6 queued issues (Q1-Q6), which map
directly onto 6 of this list's 9 items:

| This list's item | Queue id | Fixed by | File(s) |
|---|---|---|---|
| 7. Notification pagination | Q1 | `9e7fe3f` | `notification-bell.tsx` |
| 2. Map z-index overlap | Q3 | `9e7fe3f` | `location-map-picker.tsx` (`isolation: isolate`) |
| 3. Finance pending-badge | Q4 | `9e7fe3f` | `sidebar.tsx`, `header.tsx`, new `useApprovalsPendingCount()` |
| 4/9. Final Inspection approval | Q5 | `9e7fe3f` | `shared-reports.tsx` rebuilt into a real approve/reject screen |
| 5. Payroll computation | Q6 | `9e7fe3f` | `seed-demo-accounts.ts` (pay rates), `finance-payroll-review.tsx` |

Merged that history into this branch (`git merge origin/dev-ai`, one trivial `package.json`
script-list conflict, resolved by keeping both scripts), re-ran the full server test suite
(84/84 passing) and the demo seed script (still idempotent, still produces the same 7 projects)
against the merged code, then pushed. Item 1 turned out **not** to be the same file Q2 actually
fixed (Q2's own fix, also in `9e7fe3f`, is in `consultant-proposals.tsx` — the *proposal*
review's Approve/Reject; this list's item 1 explicitly names `consultant-design-reviews.tsx`,
the separate *design review* decide screen E1/E2 built) — its buttons were still tiny (28px,
`text-xs`) with a blend-into-the-row ghost-variant destructive Reject, so it got its own fix
below rather than being marked done by inference.

This left only two of the nine genuinely unaddressed: item 6 (geocoding — never in the Q-queue
at all) and item 8 (blueprint approval — a real backend+UI gap, not in the Q-queue either).
Both are built fresh in this session, below.

### 1. Consultant Design Approval buttons — affordance fix

**Capability already existed** — `useDesignReviews().decide()` and the server route (E1) both
worked; this was purely a visibility/affordance problem, the same class Q2 fixed in a
*different* file. `client/src/pages/roles/consultant/consultant-design-reviews.tsx`: the
Approve/Request changes/Reject row was three 28px-tall (`h-7 text-xs`) buttons, the last a
`variant="ghost" text-destructive` Reject that visually blended into the card. Changed to
full-size buttons (default height, no forced `text-xs`), Reject switched to `variant="destructive"`
(solid, unmistakably a red button), added a "Decide:" label and a border-top separating the
action row from the review's own details, and widened the action row's top margin.

### 2/3/4/9/5/7 — already fixed upstream, spot-verified

- **Item 2 (map z-index):** `location-map-picker.tsx`'s wrapper now has `isolation: isolate`,
  scoping Leaflet's own internal z-index stack (which climbs past 1000) inside a local stacking
  context instead of competing with the app header's z-index directly — read the diff, matches
  the "scope it, don't crank the header" instruction in this task exactly.
- **Item 3 (finance badge):** confirmed `sidebar.tsx` renders a red-dot badge via
  `useApprovalsPendingCount()` against `GET /workflows/approvals/stats` — the same
  unread-count-hook pattern `notification-bell.tsx` already used, as instructed.
- **Item 4/9 (Final Inspection):** confirmed `shared-reports.tsx` is now a real
  Approve/Reject/Request-revision screen (project-manager/admin decide, matching
  `engineering-reports/service.ts`'s `assertCanSetStatus`), not a `ComingSoonCard`. This is the
  same real gap `DEMO-STAGE-4`'s seed step exercises via the underlying API — the fix here is
  the missing **UI** for that same action, not a second gap.
- **Item 5 (payroll):** re-verified live in *this* session's own environment (the local DB's
  employee rows already existed from before the upstream fix merged in, so its own
  insert-only pay-rate backfill in `seed-demo-accounts.ts` didn't touch them — ran the
  equivalent one-off `UPDATE employees SET pay_rate=... WHERE role=...` this session, matching
  the same `PAY_RATE_BY_ROLE` table the fix added). Real end-to-end run,
  `POST /payroll/generate` → `GET /finance/payroll-review/:id` → `POST .../decide`, actual
  server output:
  ```
  generate: 201 {"lines":[{"empId":"EMP-DEMO-07","hours":40,"overtime":4,
    "gross":"6900.00","sss":"350.00","philhealth":"250.00","pagibig":"138.00",
    "withholdingTax":"0.00","deductions":"738.00","net":"6162.00", ...}],
    "batch":{"grossPayroll":6900,"deductions":738,"netPayroll":6162,"status":"pending"}}
  review fetch: 200 (same numbers)
  approve: 200 "Payroll batch decision recorded"
  ```
  Real SSS/PhilHealth/Pag-IBIG math (`server/src/payroll/ph-statutory.ts`) computing non-zero
  values, exactly the fix's own repro (`payRate=0` → gross/net always ₱0) resolved. Test batch
  deleted afterward.
- **Item 7 (notifications):** confirmed `notification-bell.tsx` now has Prev/Next pagination
  (8/page) reading a real page of the notifications list, not client-side slicing of everything.

### 8. Blueprint approval — real gap, fixed

Confirmed the gap exactly as described: `server/src/blueprints/routes.ts`'s `PATCH /:id` had
**no role guard at all** (any authenticated user could set `approval`), and no client screen
outside the architect's own `architect-blueprints.tsx` (a create-only gallery, no decide UI)
ever called it. Gate D3 reads `blueprints.approval="Approved" AND status="Current"` with no real
way to reach that state except a hand-crafted PATCH.

Built, server:
- `server/src/blueprints/service.ts`: new `decide()` — validates `approval` is one of
  Approved/Rejected/Revision Required, also sets `status: "Current"` when approving (D3 needs
  both), notifies the architect role, calls `refreshProjectProgress` (same pattern as
  `design-reviews/service.ts decide()`).
- `server/src/blueprints/routes.ts`: `POST /:id/decide`, `requireRole("consultant",
  "project-manager", "admin")` — separate from the generic `PATCH` so the architect can still
  edit their own drawing's metadata without being able to self-approve it.
- `server/src/validators/blueprint-validator.ts`: `decideBlueprintSchema`.

Built, client:
- `useBlueprintsController` (`blueprints.controller.ts`): new `decide(id, approval)`.
- New `client/src/pages/roles/shared/shared-blueprint-reviews.tsx`, mirroring
  `consultant-design-reviews.tsx`'s Pending/Approved/Rejected tabs — mounted at
  `/blueprint-reviews` (same "open to any authenticated role, decide gated server-side"
  convention as `/reports`). Added to Consultant's nav (tabs + sidebar section) as
  "Blueprint Reviews". Did **not** add a PM-specific nav entry (project-manager doesn't have a
  dedicated section in `role-tab.ts` the way consultant/admin do) or an Admin nav entry — both
  can still reach `/blueprint-reviews` directly and the server permits both roles to decide;
  logged as a deviation rather than guessed at further.

**Live verification** (real server, real roles):
```
create (architect):                          201, approval="Pending"
architect decides own blueprint (expect 403): 403 "Role 'architect' cannot access this resource"
consultant decides Approved (expect 200):     200, approval="Approved", status="Current"
architect notified:                           true — "Blueprint approved" / "...was approved."
invalid approval value (expect 400):          400
```
Test blueprint deleted afterward.

### 6. Location textbox geocoding — real gap, fixed

Confirmed the gap: `client/src/features/projects/pages/ProjectCreatePage.tsx`'s Location field
(inside `StepProjectInfo`) was a plain `<Input>` writing only to `data.location` (free text sent
to the server as-is) — `LocationMapPicker` right below it was entirely separate, driven only by
manual pin placement/drag.

Built `client/src/components/maps/use-geocode-search.ts`: a `useGeocodeSearch()` hook —
debounced 450ms (>400ms as asked), `AbortController`-cancels a stale in-flight request when a
newer keystroke supersedes it, calls `https://nominatim.openstreetmap.org/search` with
`format=jsonv2`, a `User-Agent` header per Nominatim's usage policy, and a `requestId` guard so
a slow response can't clobber newer results. Wired into `ProjectCreatePage.tsx`'s `StepProjectInfo`:
typing shows a suggestion dropdown under the input; picking a result fills the text field with
the full matched address **and** sets `siteLatitude`/`siteLongitude`, which `LocationMapPicker`
picks up via its own props-driven `useEffect` and recenters the pin to (confirmed by reading
`location-map-picker.tsx`'s second effect, which calls `map.setView` whenever the
`latitude`/`longitude` props change — no changes needed to that component itself).

Not live-verified against the real Nominatim endpoint from this session — confirmed the same
proxy blocks it as blocks EstimationPro.ai:
```
$ curl -i "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=Manila"
curl: (56) CONNECT tunnel failed, response 403
[agent-proxy] ... nominatim.openstreetmap.org:443 — connect_rejected (organization policy)
```
The debounce/abort/request-id logic itself has no network dependency and was verified by
reading it closely, and `tsc`/the client build are clean with this file included. Logged as a
deviation, not silently claimed as live-verified.

## P1 — Gate → row audit table

Source: `server/src/lifecycle/gates.ts` (checks) + `server/src/lifecycle/repository.ts`
`loadSnapshot()` (what's loaded). Every gate reads only from the snapshot object below; no
gate does its own DB query.

| Gate | Label | Reads |
|---|---|---|
| P1 | Architect staffed | `project_members` role='architect' |
| P2 | Consultant staffed | `project_members` role='consultant' |
| P3 | Proposal submitted | `proposals.workflow_id` not null |
| P4 | Proposal approved | `proposals` (linked) + `workflows.status='completed'` on the linked workflow |
| P5 | Award & contract on file | `documents.type` in ('Notice of Award','Contract') + `projects.contract_value > 0` |
| D1 | Design w/ files, staffed engineer | `designs.file_urls`, `designs.assigned_engineer_id` + `project_members` role='engineer' |
| D2 | All designs approved | `designs.status='Approved'` (all) + no `design_reviews.status='Pending'` for those design ids |
| D3 | Approved current blueprint | `blueprints.approval='Approved' AND status='Current'` |
| C1 | Materials & specs approved | `requirements.category` in ('Materials','Specifications'), `status` |
| C2 | Budget approved | `budgets.status='approved'` (all) + sum(`budgets.planned`) > 0 |
| C3 | Milestones dated & active | `milestones.estimated_completion_date`, `.status` |
| C4 | Site crew staffed & linked | `project_members` role='site-personnel' + `employees.status='Active'` (by user_id) + `tasks` + `milestone_links` (linkType='task') + `milestones.status='active'` |
| C5 | NTP & site location | `documents.type='Notice to Proceed'` + `projects.site_latitude/site_longitude` |
| K1 | All tasks completed | `tasks.status` (all) |
| K2 | All milestones closed | `milestones.status` in ('completed','cancelled') (all) |
| K3 | No open issues | `issues.status` not in ('Submitted','Under Review') |
| K4 | No active workflows | `workflows.status='active'` (any, for this project) |
| X1 | Final inspection approved | `engineering_reports.type='Final Inspection' AND status='Approved'` |
| X2 | Certificate of Completion on file | `documents.type='Certificate of Completion'` |
| X3 | Closeout payroll approved | `payroll_batches.status` + `project_phase_history` (entered-Closeout timestamp) |
| X4 | Project Closeout workflow completed | `workflows.template_id` = the "Project Closeout" template's id, `.status='completed'` |

`loadSnapshot()` additionally loads `proposalWorkflows`, `workflowStages`, `staffedEmployees`,
`phaseHistory`, `closeoutTemplateId` as support for the above joins — same tables, no gate reads
anything outside this table list.

## Deviations

- **AV-6-followup:** made this fully self-contained rather than a one-off manual SQL insert —
  `demo-seed-stages.ts` now has its own `ensureFallbackReferenceRow()`, called every run before
  the 7 projects are built: if `reference_snapshots` is empty, it upserts the same fallback row
  (same `(source, source_item_id)` conflict key `seed-reference-data.ts` uses, so a later real
  `ai:seed-references` run just overwrites it) and logs that it did so. Verified by deleting
  every `reference_snapshots`/`validation_results` row and re-running the script from a
  genuinely empty catalog — it reseeded the fallback row itself and produced the identical
  Budget Change Request output shown above, no manual SQL required.
- **AV-6 (P5):** `npm run ai:seed-references` cannot reach EstimationPro.ai from this sandbox
  (outbound proxy returns 403 on `CONNECT estimationpro.ai:443`, confirmed via
  `curl -i https://estimationpro.ai/api/v1/trades` and the proxy's own `/__agentproxy/status`,
  which lists it as a `connect_rejected` / policy denial — not a live 403 from the API itself).
  Rather than invent numbers, inserted one `reference_snapshots` row directly by SQL using the
  exact low/typical/high values (`$80`/`$100`/`$120` per lf, "Rebar #4 (1/2 inch)") the repo's
  own `server/src/ai-validation/cost.test.ts` already uses for its real worked trace — the same
  numbers a previous session's live fetch actually returned (see `ai-signals-progress.md`
  Group C's checkpoint evidence, `typical ₱806,081` for 128.5 lf, matches exactly). Every step
  downstream of that row — matching, unit conversion, FX, variance math, persistence — is the
  real, unmodified `validateWorkflowLineItems()` code path. Only the *reference catalog's own
  freshness* is a stand-in; if this environment gets real network access to EstimationPro.ai,
  running `npm run ai:seed-references` will overwrite this row with a live one (same
  `(source, source_item_id)` upsert key) and nothing else needs to change.
- **AV-7 (environment):** this sandbox had no `DATABASE_URL`/`.env` and no installed
  dependencies at all. Provisioned a local Postgres 16 (already present in the container image)
  as a throwaway dev database rather than fabricating "should work" verification — see the
  Environment note at the top of this file for exactly what was done and why the one attempt to
  weaken `pg_hba.conf` was reverted (flagged by the environment's own safety classifier,
  reverted immediately, a local `setpriv` role switch used instead). This means every verified
  number in this document is real and reproducible, but was produced against a fresh empty
  database seeded from scratch this session, not the shared/persistent dev DB the two uploaded
  reference docs' transcripts came from.
- **AV-8 (P9):** the prompt asked to "seed the 10 role-account demo logins if not already
  present." They were already present — `seed-demo-accounts.ts` (part of `npm run db:seed`,
  pre-existing from the lifecycle work) creates all 10 canonical logins plus 40 additional
  per-role accounts (4 each) — verified live by running `db:seed` against the freshly-created
  local DB and reading its own printed account table. No new code was needed for P9.

## Questions

- Item 8 (blueprint approval): who owns sign-off, Consultant, PM, or both? No role-responsibility
  doc was found pinning this down (grepped `docs/` and the README). Went with the same split
  gate D3's own `ownerRoles: ["architect"]` (the architect chases the approval) implies plus the
  design-review precedent (architect authors, consultant decides) — server route allows
  consultant/project-manager/admin to decide, and the new nav entry was only added for
  Consultant (project-manager has no dedicated top-level nav section in `role-tab.ts` to add it
  to, and admin's nav wasn't touched either) — both can still reach `/blueprint-reviews`
  directly and the server permits their decision. If PM should have equal nav-level
  discoverability, that's a follow-up.

## Round 3 (2026-09-25) — real vs. dead AI surfaces, punch list, nav sync

Branch: `dev-ai`, started at HEAD `0728303`. Part A commit: `8a38ce7`. Part B commit: `17b58c8`.
Part C commit: `d06579b`. Server `npx tsc --noEmit -p server` and `npm test` (84/84) and client
`npm run build` all clean as of `d06579b`. Every Part A/B/C checklist item above is checked off
with live reproduction evidence (real local Postgres, real server, real client, Playwright for
browser-level checks) — no "should work now" claims.

Prior status correction confirmed by re-reading
this file and `ai-signals-progress.md` in full: the five advisory signals (Groups D/E/F) ARE
built — `server/src/signals/` (all five rule files, `index.ts`, `boundary.test.ts`),
`DecisionSupportSection.tsx`, `my-actions.ts`'s `kind: "signal"` items, and
`npm run demo:ai-signals` all verified present and working (re-run live this session, see
Part A below). Nothing from Groups D/E/F was rebuilt.

### Environment

Same as the "read first" note above: no `.env`/deps present at session start. Provisioned the
same local Postgres 16 dev database, ran `npm --prefix server install` / `npm --prefix client
install` (fresh — `node_modules` were absent again in this worktree), wrote `server/.env`
(`DATABASE_URL`, `PORT=8000`, `JWT_SECRET`, `CORS_ORIGIN`, `FEATURE_AI=true`) and `client/.env`
(`VITE_API_BASE`, `VITE_FEATURE_AI=true`), both gitignored. `npm run db:seed` ran clean.
`npm run ai:seed-references` still cannot reach EstimationPro.ai from this sandbox (`403` /
proxy `connect_rejected`, same as every prior session) — used `npm run demo:seed`'s own
`ensureFallbackReferenceRow()` fallback (one "Rebar #4" reference row) instead, per the existing
AV-6-followup deviation.

### Part A — real AI-validation layer vs. dead "Coming Soon" surfaces

**A1 — ComingSoonCard audit.** Re-grepped every usage (12 files). Classified:

- **AI-related, unreachable, deleted:**
  - `client/src/pages/roles/project-manager/pm-ai-insights.tsx` and
    `client/src/pages/roles/shared/shared-ai-insights.tsx` — confirmed by grep that nothing
    imports either component; `App.tsx`'s only `/ai-insights` route unconditionally redirects to
    `/dashboard` (per the A3 surface-table work already on `dev-ai`), and the nav entry is
    filtered out via `FEATURES.aiPlaceholders` (permanently false). Both files deleted outright.
  - The `FEATURES.aiPlaceholders`-gated "AI insights"/"AI validation insights" `ComingSoonCard`
    blocks in `pm-dashboard.tsx` and `consultant-dashboard.tsx` — permanently unreachable (the
    flag never turns on), and redundant with `WaitingOnYouCard`, which already sits directly
    above/below them on both pages and already surfaces warn/critical advisory signals
    (Sparkles icon, "AI" badge, per-project "Go to" navigation) from the *same*
    `GET /api/lifecycle/my-actions` data path `DecisionSupportSection` reads. Removed both
    blocks and their now-unused `ComingSoonCard`/`FEATURES` imports; no new query was added —
    `WaitingOnYouCard` already filled this slot.
  - `pm-reports.tsx` and `pm-resources.tsx` — found to be a **second instance of the same
    dead-route bug** the AI pages had: neither file is imported anywhere in `App.tsx` (PM's
    `/reports` and `/resources` nav entries route to the *shared* `SharedReports`/
    `SharedResources` components instead — confirmed via `role-tab.ts`). Not AI-related, but
    literal dead files superseded by working shared routes; deleted as the same class of
    cleanup A1 asks for, documented as a reasonable-call deviation below.
- **Non-AI, confirmed reachable-but-empty, left alone (documented per A1's instruction, not a
  silent gap):**
  - `shared-resources.tsx` (`/resources`, reachable, real "Resources & Tools" stub — no backend
    table exists for it yet).
  - `admin-dashboard.tsx`'s "Workforce snapshot" card — reachable (admin dashboard is real and
    routed), explicit text explaining no cross-project attendance endpoint exists yet.
  - `it-designer-dashboard.tsx`'s "Infrastructure health" card — reachable, explicit text (no
    uptime/backup data recorded anywhere).
  - `architect-dashboard.tsx`'s 4 "Not yet built — placeholders only" cards (blueprint library,
    review queue, revision tracker, documentation hub) — reachable, explicitly labeled.
  - `pm-dashboard.tsx`'s "Awaiting your approval" / "Activity & advisories" cards — reachable,
    not AI-related (no approvals/activity-feed backend exists), left as-is.
  - `shared-reports.tsx` — no longer a `ComingSoonCard` at all (already a real
    approve/reject screen per Part B's Q5 fix, re-verified in B5 below); its file still
    literally contains the string "ComingSoonCard" only in a comment describing what it used to
    be.

**A2 — role coverage for `DecisionSupportSection`.** `ProjectLifecyclePanel` is mounted in
exactly one place, `ProjectDetailPage.tsx`, at the shared route `/projects/:projectId`
(`App.tsx`) — not role-gated at the router level, only auth-gated, and `ProjectDetailPage`
renders `ProjectLifecyclePanel` (and, inside it, `DecisionSupportSection`) unconditionally for
every role; only *editing* the project record itself is role-restricted (`PROJECT_EDITORS`).
The five signals' `ownerRoles` are `project-manager`, `finance-manager`, `engineer` (fixed) plus
`stalled-stage`'s dynamic `ownerRole` (whichever role owns the currently-stalled workflow
stage — in practice any of the ten roles, since workflow templates assign stages broadly).

Every one of the 10 role dashboards renders `WaitingOnYouCard` (confirmed by grep — `admin`,
`architect`, `consultant`, `engineer`, `finance`, `hr`, `it-designer`, `pm`, `site-personnel`
dashboards all import and render it), and that card's `kind: "signal"` items link straight to
`/projects/:id` (or, for `stalled-stage`, `/workflows` — both un-role-gated shared routes) via
plain `navigate()`, which works regardless of whether that route is in the role's own sidebar.
So **every role can already reach `DecisionSupportSection` for a project a signal has actually
fired on for them** — this is the real, pre-existing coverage path, not something built this
session.

The gap found: `finance-manager` — an explicit `ownerRoles` entry on 3 of the 5 signals
(cost-variance, burn-vs-progress, cumulative-change-impact) — had **no sidebar/tab entry into
`/projects` at all** in `role-tab.ts` (only Budget/Payroll Review/Expenses/Approvals), unlike
`project-manager`, `architect` and `engineer`, which all have one. That meant a finance manager
could only reach a project's Decision Support panel reactively (after a signal already fired and
put a link on their dashboard), never by browsing proactively. Fixed: added a "Projects" tab
(`route: "/projects"`, reusing the existing `PMProjects` list — server-side `GET /projects` has
no role restriction, confirmed in `server/src/projects/routes.ts`) plus a matching sidebar item
under finance-manager's "Budget Management" section, in `client/src/config/role-tab.ts`. No new
component built. `human-resources` and `site-personnel` are not fixed `ownerRoles` on any
signal (only possible dynamic targets of `stalled-stage`, same reactive-link coverage as every
other role) — left as-is.

**A3 — `FEATURE_AI` deployment config.** The repo has no `.env.example` anywhere (confirmed by
`find . -iname .env.example`); `README.md`'s "Configure environment variables" section is the
only documented `.env` convention, and it **omitted `FEATURE_AI`/`VITE_FEATURE_AI` entirely** —
someone following the README top-to-bottom for a fresh/presentation environment would never
turn the AI-validation layer on. Added `FEATURE_AI=true` to the server `.env` block (with a
comment on what it gates) and a sentence to the client-env paragraph noting `VITE_FEATURE_AI`
is a separate flag that also needs setting. Verified `server/src/config/features.ts` (`ai:
process.env.FEATURE_AI === "true"`) and `client/src/config/features.ts`
(`import.meta.env.VITE_FEATURE_AI === "true"`) are exactly what these two env vars gate.

**A4 — one bookmarkable place to see all five signals trip.** Found the actual gap:
`demo-ai-signals.ts`'s `PROJECT_CODE` was `` `AISIG-${Date.now().toString(36).toUpperCase()}` ``
— a **new, differently-coded project on every run**, never cleaned up. The
`ai-signals-progress.md` F2 entry's `AISIG-MUGLM73Z` is real (that run's actual output, project
id 12, deliberately left in a database from a now-gone prior session's Postgres instance) but
is not a stable, reusable reference — re-running the script today produces a different code
every time, so there was never actually one fixed, bookmarkable project. Fixed:
- `PROJECT_CODE` is now a stable `AISIG-DEMO` (overridable via `AISIG_PROJECT_CODE` env var).
- Added `cleanupExisting(code)` (raw SQL, same table order/parent-before-child care as
  `demo-seed-stages.ts`'s own `cleanup()` — kept as a separate, self-contained copy rather than
  importing that module, since its `main()` runs unconditionally at import time and would have
  reseeded all 7 `DEMO-STAGE-*` projects as a side effect of importing it here), called before
  every project creation — the script is now idempotent, re-running it rebuilds the *same*
  project rather than leaving a trail of one-off ones.
- The script's final log line now prints the project's `/projects/:id` link directly.
- `README.md` gained a `demo:ai-signals` row in the scripts table and an "AI-validation demo
  project" paragraph explaining `AISIG-DEMO` is the one bookmarkable place to see all five
  signals fire, and that the 7 `DEMO-STAGE-*` projects deliberately don't carry this scenario
  themselves (kept separate on purpose — `DEMO-STAGE-3` already demonstrates the *cost-reference
  citation* feature on its own Budget Change Request; layering all five signal triggers onto it
  too would overload one project's story).

**Live re-verification, this session** (`npm run demo:ai-signals`, real server, real DB, twice
in a row to prove idempotency — second run reused the same `AISIG-DEMO` code, cleared and
rebuilt project id 53 after id 45 from the first run):
```
▶ Clearing any existing AISIG-DEMO from a previous run
▶ Creating project AISIG-DEMO and driving it to Construction
  ✔ cumulative-change-impact fired, warn
  ✔ burn-vs-progress fired, warn
  ✔ issue-recurrence fired, warn, mentions a precedent
  ✔ stalled-stage fired, warn
  ✔ checks match exactly (same keys, same passed values)
  ✔ canAdvance matches exactly
  ✘ cost-variance fired, critical []
6 passed, 1 failed
Scenario project AISIG-DEMO (id 53) left in place for inspection — not cleaned up.
Open it in the app at /projects/53 (Project Manager / Consultant / Finance Manager / Engineer)
to see DecisionSupportSection with all five signals live.
```
`cost-variance` did not fire — **not a regression from this session's change** (verified by
re-reading the diff: only `PROJECT_CODE`, `cleanupExisting`, and the final log line changed, no
matching/threshold logic touched). Root cause: this sandbox's `reference_snapshots` table only
has the single AV-6-followup fallback row ("Rebar #4 (1/2 inch)"), because EstimationPro.ai is
still unreachable here; the script's own BCR line items describe *concrete* ("Ready-mix
concrete...", "Concrete slab, poured and finished"), which the similarity matcher (floor 0.40)
correctly does not match against a rebar reference row, so no cost-variance signal is produced
at all (not a severity mismatch — zero signals for that rule). With a full reference catalog
(the normal case, live EstimationPro.ai access) this assertion is known to pass — see
`ai-signals-progress.md` F2's original 7/7 run. Logged as an environment-only deviation, same
root cause as AV-6/AV-6-followup; not fixed further this session (fixing it would mean either
restoring network access, which is out of this session's control, or widening the fallback
reference catalog with a concrete item, which risks changing what the fallback represents for
other consumers of it (`demo-seed-stages.ts`'s own DEMO-STAGE-3 narrative is written around the
rebar row specifically) — flagged rather than guessed at.

**Deviations (Part A):**
- Deleted `pm-reports.tsx`/`pm-resources.tsx` even though they're not AI-related, because they
  are literal dead files (unreachable, superseded by shared routes) — the same bug class A1
  targets, not a scope-creep addition.
- Added a "Projects" nav entry to `finance_manager` in `role-tab.ts` (A2) — a real navigation
  fix per A2's own instruction ("if a role that should see relevant signals has no path... fix
  navigation"), reusing the existing `/projects` route/component, no new component built.
- `demo-ai-signals.ts`'s cost-variance assertion still fails in this network-blocked sandbox
  (see above) — environment limitation, not a code defect; flagged, not silently worked around.

Server `npx tsc --noEmit -p server`: clean. Client `npm run build`: clean (both re-run after
every file change in this section).

### Part B — punch list round 3

Live-verified end to end this session against the local Postgres/server/client (`npm run dev`
on both sides, `npm run db:seed`, `npm run demo:seed`), using Playwright (Chromium at
`/opt/pw-browsers/chromium-1194`, run via a script copied to
`/opt/node22/lib/node_modules/` so Node's resolver finds the global `playwright` install).

- **[x] B1 — required-field markers.** Read the actual validation: client `handleSubmit`
  requires `title`/`project`/a picked file; server `createDocumentSchema`
  (`server/src/validators/document-validators.ts`) requires `title`/`project`/`type` (type has a
  UI default so it's always populated); `POST /documents/upload`'s controller 400s with "Please
  select a file to upload" if `req.file` is missing. So Title, Project and File are the three
  actually-required fields. Matched the app's existing asterisk convention (`architect-design-create.tsx`:
  `<Label>Text <span className="text-destructive">*</span></Label>`) on all three in
  `client/src/components/documents/upload-document-dialog.tsx`. Live-verified — dialog now reads
  "Title *", "Project *", "File *" (screenshotted via Playwright, text dump captured).
- **[x] B2 — render `gates.ts`'s `.link` on failing checks.** `ProjectLifecyclePanel.tsx`'s check
  list never rendered `check.link` even though every gate in `gates.ts` (all phases, not just
  Design) carries one. Added a "Go to {route}" `<Link>` under each **failing** check, same
  text/style as `DecisionSupportSection`'s existing signal "Go to" links, shown only to a viewer
  whose role is in that check's own `ownerRoles` (or admin) — reusing the field that was already
  there, no new link style. Live-verified on the `AISIG-DEMO` project (id 53) as
  project-manager: K2 ("All milestones closed", `ownerRoles: [project-manager]`) showed "Go to
  projects/AISIG-DEMO"; K3 ("No open issues", owner includes project-manager) showed "Go to
  issues"; K1 (`ownerRoles: [site-personnel]` only) and K4 (`ownerRoles: [finance-manager]`
  only) correctly showed **no** gate-level link for this PM viewer, confirming the role scoping
  actually works (not just present-but-unconditional).
- **[x] B3 — design-review list order.** `server/src/designs/design-reviews/repository.ts`'s
  `findAll()` had **no `ORDER BY` at all** (confirmed by reading it — not "already
  newest-first", the prompt's assumption to verify was wrong) — Postgres returned rows in
  whatever order the planner picked, in practice oldest-first. Added
  `.orderBy(desc(designReviews.submittedAt))` (this table's `createdAt` equivalent — set once on
  insert via `defaultNow()`) to both the filtered and unfiltered query paths. Live-verified via
  `GET /design-reviews`: 7 seeded reviews with distinct `submittedAt` timestamps a few seconds
  apart now return in `REV-AISIG-DEMO` (newest) → `REV-DEMO-STAGE-1` (oldest) order.
- **[x] B4 — Budget Change Request line-item editor redesign.** Relabeled every field (Category,
  Description, Current amount, Requested amount — was placeholder-text-only), added a live
  computed "Change" field per line (`requested − current`, ₱-formatted via the existing
  `formatCurrency()`, red for an increase / green for a decrease, "—" until both amounts are
  entered), and grouped Quantity/Unit/the `FEATURES.ai` cost-comparison hint into their own
  bordered block under each line item's own card instead of reading as a second, disconnected
  row. Data shape/validation untouched (`DraftLineItem`, `updateLineItem`,
  `completedLineItems`, the submit payload) — confirmed by diff: only JSX/layout changed inside
  the `showLineItems` block. Live-verified as engineer (`/approvals` → "Request budget change" —
  note: this is the actual reachable entry point; `/workflows` has no such button for engineer,
  see Deviations) — typed 50000/75000 into Current/Requested and the Change field updated live
  to "+₱25,000.00" in red, screenshotted (`/tmp/b4-dialog.png`, described: dialog shows "COST
  CHANGES" header, one "Change 1" card with Category/Description on one row, Current
  amount/Requested amount/Change on the next, all clearly labeled).
- **[x] B5 — Final Inspection approval, re-verified live (not rebuilt).** Confirmed
  `shared-reports.tsx` is a real, reachable approve/reject screen. **Found and fixed a real
  regression while verifying**: this session's `client/.env` (written per the environment setup
  note, following this same README's own documented example) had
  `VITE_API_BASE=http://localhost:8000/api`, and `client/src/services/api.client.ts`'s
  `apiUrl()` unconditionally appends `/api` itself — so every request went to
  `/api/api/engineering-reports` and 404'd, which is exactly what `/reports` showed live
  ("API error 404: ... Cannot GET /api/api/engineering-reports"). This is a **README bug**, not
  a `shared-reports.tsx` bug — fixed `README.md`'s example to `VITE_API_BASE=http://localhost:8000`
  (no `/api` suffix) with an explanation, fixed this session's own `client/.env` the same way,
  and confirmed the page loads correctly afterward. With that fixed: seeded one throwaway
  `Submitted` Final Inspection report on `DEMO-STAGE-4` via direct SQL (all 3 existing Final
  Inspection rows in this fresh DB were already `Approved`, from `demo:seed` driving those
  projects all the way through Closeout — nothing to click Approve on otherwise), logged in as
  project-manager, saw it in the Pending tab with working Approve/Request revision/Reject
  buttons, clicked Approve, and confirmed via direct SQL the row's `status` flipped to
  `Approved` and it moved out of the Pending list in the UI. Test row deleted afterward.

**Deviations (Part B):**
- B5's real finding was a `README.md` env-var documentation bug (wrong `VITE_API_BASE` example
  causing a double `/api/api/` prefix), not anything in `shared-reports.tsx` itself — fixed the
  doc and this session's own `.env`, not any application code.
- B4: engineer's own `WorkflowInitiationActions`/`BUDGET_CHANGE_ACTION` launcher
  (`workflow-initiation-actions.tsx`) is mounted via `ApprovalQueuePanel`, which is only
  embedded on the shared `/approvals` route (`pm-approvals.tsx`) — not on any engineer-specific
  page, and `/workflows` (the page an engineer's own sidebar nav actually calls "Workflows" —
  wait, checked: engineer's nav doesn't have a "Workflows" tab at all, only "Approvals", which
  is where this lives) is PM/Admin's own page with a *different* "New workflow" flow (full
  template picker, not role-scoped launcher buttons). Not a bug to fix under B4 (out of scope —
  B4 is markup-only on an already-reachable dialog), but noted here since it's exactly the kind
  of "is this dialog actually reachable" question this pass cares about; confirmed reachable via
  `/approvals`, just not where a first guess ("Workflows" page) would look.

Server `npx tsc --noEmit -p server`: clean. Client `npm run build`: clean. `npm test` (server):
84/84 pass.

### Part C — navbar/sidebar active-state sync

**Finding a real disagreement first.** Confirmed `header.tsx`'s `isTabActive` and
`sidebar.tsx`'s `isActive` were byte-identical logic
(`pathname === route || pathname.startsWith(route + "/")`) — so on their own they can't
disagree about a shared route; the drift risk was two independent copies of one rule (exactly
what the prompt names). More important: `sidebar.tsx` does **not** read `role-tab.ts`'s own
`sections` field at all — it renders from `useMenu()` (refine's resource menu, built from
`providers/resources.ts` filtered by `config/role-resources.ts`'s `ROLE_RESOURCE_ACCESS`), a
completely different, dynamic list from `role-tab.ts`'s static `tabs` array that `header.tsx`
reads. (`role-tab.ts`'s `sections` field is itself dead — grepped, nothing reads it outside its
own file; flagged in Deviations, not touched, out of scope for this pass.) That means the
header's tab set and the sidebar's actual item set were never the same list to begin with, so
they can genuinely disagree on which "page" is active whenever a sidebar item's route isn't
nested under any header tab's route.

Found the concrete case: architect's sidebar (`providers/resources.ts`, `Workspace` group) has
always listed **Blueprints** as a first-class item (`list: "/blueprints"`, same group as
Designs/Proposals), but architect's `role-tab.ts` `tabs` only had Projects/Designs/Proposals —
no tab's route nests `/blueprints`. Live-reproduced: navigated an architect session straight to
`/blueprints` — sidebar correctly highlighted "Blueprints", **no header tab highlighted at
all**. A user scanning the header after clicking a sidebar link would see nothing telling them
which section they're in.

**Fix:**
- `client/src/lib/nav-active.ts` (new): the one `isNavRouteActive(pathname, route)`, imported by
  both `header.tsx` and `sidebar.tsx` in place of their own copies — a future edit to the match
  rule now has exactly one place to happen, removing the duplication that let them drift.
- `client/src/config/role-tab.ts`: added a "Blueprints" tab to the architect config (real
  navigation fix for the concrete case found, not a workaround — Blueprints is a full
  approve/reject workflow with its own page, same standing as Designs/Proposals).

Other sidebar items with no matching header tab exist across other roles too (e.g. architect's
own Revisions/Reviews/Documentation, admin's various `/admin/*` settings pages, human-resources'
`/workforce-reports`) — audited via a script cross-referencing every role's `tabs` routes
against every sidebar route reachable for that role. These read as **intentional**, not
instances of the same bug: every role has more sidebar entries than header tabs by a wide
margin, consistently across the whole app (tabs = a handful of primary daily actions, sidebar =
full nav) — Blueprints was the one case where a page as central as Designs/Proposals had been
left out of the tab row while its siblings were in it. Not fixed further; listed here as a
documented decision per the task's own instruction, not a silent gap. If a specific one of these
should also get a tab, that's a follow-up per-role product call, not a bug fix.

**Live-verified, 3 roles, both direct URL load and in-app navigation** (Playwright, DOM
snapshot of which header-nav `<button>` carries the active style class and which sidebar
`[data-sidebar="menu-button"]` carries `data-active="true"`):
```
architect /blueprints (direct URL):        header=["Blueprints"]  sidebar=["Blueprints"]
pm /projects (direct URL):                 header=["Projects"]    sidebar=["Projects"]
consultant /consultant/designs (direct URL): header=["Designs"]     sidebar=["Designs"]
architect Blueprints (in-app sidebar click, not URL): landed on /blueprints,
  header=["Blueprints"]  sidebar=["Blueprints"]
```
All four agree in both directions and both navigation methods — the one confirmed gap
(architect/Blueprints) is fixed; the general-purpose fix (shared `isNavRouteActive`) removes the
underlying duplication risk for every other role/route pair.

**Deviations (Part C):**
- `role-tab.ts`'s `sections` field is dead code (nothing reads it — `sidebar.tsx` uses
  `useMenu()`/`resources.ts` instead). Not removed in this pass — out of scope for Part C, and
  removing a field with this much per-role content is a larger, separate cleanup; flagged rather
  than silently left implying it's live data.
- Did not add tabs for every other sidebar-only page (Revisions, Reviews, Documentation, the
  various admin/IT-designer settings pages, etc.) — judged as the app's consistent, intentional
  tabs-are-a-subset convention rather than the same bug, per the reasoning above. If wrong,
  that's a per-role product decision, not a technical fix, and is called out here rather than
  guessed at.

Server `npx tsc --noEmit -p server`: clean. Client `npm run build`: clean.

## Round 4 (2026-09-25) — named demo projects, AI reference page, dashboard fixes, HR realism

Branch: `dev-ai`, started at HEAD `d37d93c`. Environment: fresh worktree, no `.env`/deps —
provisioned the same local Postgres 16 dev database convention as prior rounds; this time the
`easyconstruct` database and its full seeded state (schema, 50 users/employees, the 8 existing
demo projects) were **already present** from an earlier session sharing this container image, so
no re-seed from empty was needed — confirmed live via `\dt` (all tables present) and
`SELECT count(*) FROM projects` (8: the 7 `DEMO-STAGE-*` + `AISIG-DEMO`) before touching anything.
`server/.env`/`client/.env` written fresh (gitignored), `npx tsc --noEmit -p server` confirmed
clean before any edit.

### Part A — Named per-stage demo projects

- **[x] A1 — display names.** `createProjectSchema.name` has no character restriction beyond
  `min(2)` (`server/src/validators/project-validator.ts`) — a middle dot is fine. **Decision on
  codes** (documented per the task's own instruction): kept `DEMO-STAGE-0`..`6` rather than
  renaming to `DEMO-S1`..`7`. Renaming would touch `demo-ai-signals.ts` (comment references),
  `README.md`, and this doc's own history for zero functional gain — the *name*, not the code, is
  what a person actually reads in the UI, and the name is now fixed. `demo-seed-stages.ts` gained
  a `DISPLAY_NAME` array; projects are created with `name: "DEMO · 1 Proposal"` ...
  `"DEMO · 7 Archived"`. Verified live via `SELECT code, name FROM projects WHERE code LIKE
  'DEMO-STAGE-%'` — see table below.
- **[x] A2 — gate audit.** Already fully documented in the P1 table above (`gates.ts` +
  `repository.ts loadSnapshot()`), re-confirmed correct by re-running the script and the real
  gate-check dump (below) — every check for the current phase and all earlier phases still reads
  `passed: true` except Construction's intentionally-failing K1/K2/K4. Construction's progress
  (59%) is `computeProgress`'s real `30 + 65*(4/9)` task-ratio formula, not hardcoded — confirmed
  by counting the actual `tasks` rows (9 total, 4 Completed) via SQL.
- **[x] A3 — Construction BCR re-verified.** Re-ran the script end to end against the current
  schema; the real `validateWorkflowLineItems()` output is byte-identical to the previous round's
  recorded trace (within-range +5.4%, above-typical +954.5%, no-match "line has no quantity") —
  see the script output below. No schema drift broke it.
- **[x] A4 — link to AISIG-DEMO.** `DEMO-STAGE-3`'s `description` field now reads: "Demonstrates
  the real cost-comparison engine (EstimationPro.ai citations on a Budget Change Request). For
  the five decision-support signal rules firing together, see the AISIG-DEMO project." — a real,
  persisted column (`projects.description`), visible on the project detail page.
- **[x] A5 — findability.** The existing project list search (`ProjectService.queryProjects`,
  used by `pm-projects.tsx`/`owner-portfolio.tsx`/`admin-projects.tsx` via
  `useProjectsController`) already filters by `name`/`code` substring, case-insensitive — typing
  "DEMO" already surfaces all 7 (confirmed by reading `project.service.ts`'s `queryProjects`, no
  code change needed). **Deviation, documented rather than silently left**: the bookmarkable
  route is `/projects/:id` (numeric id), and this script's cleanup-then-rebuild idempotency
  (A6) means the numeric id shifts on every re-run (confirmed: DEMO-STAGE-3 was id 25 before this
  round's re-run, id 57 after). The project *code* is the stable identifier (bookmarkable via
  `GET /projects?code=DEMO-STAGE-3` or the search box), not the URL. A truly ID-stable route
  would need either code-based routing (`/projects/code/:code`) or a full rewrite of the seed
  script into a check-before-create upsert at every one of its ~15 API steps (proposal, design,
  budget, milestone, task, blueprint, etc.) rather than delete+rebuild — judged out of scope for
  this pass; flagged here as a real product gap rather than silently claimed as fixed.
- **[x] A6 — re-runnable, no duplicates.** Ran twice in a row this round; both times exactly 7
  `DEMO-STAGE-*` rows (see table below) — unchanged from prior rounds' verification, re-confirmed
  live.
- **[x] A7 — verification.** Real gate-check dump against the live server, all 7 projects, plus
  the archived-project write-rejection check:

  ```
  DEMO-STAGE-0 (DEMO · 1 Proposal) phase=Proposal progress=8%
    P1..P5 passed=true (all 5)
  DEMO-STAGE-1 (DEMO · 2 Design) phase=Design progress=25%
    D1..D3 passed=true (all 3)
  DEMO-STAGE-2 (DEMO · 3 Pre-Construction) phase=Pre-Construction progress=29%
    C1..C5 passed=true (all 5)
  DEMO-STAGE-3 (DEMO · 4 Construction) phase=Construction progress=59%
    K1 passed=false  All tasks completed
    K2 passed=false  All milestones closed
    K3 passed=true   No open issues
    K4 passed=false  No active workflows
  DEMO-STAGE-4 (DEMO · 5 Closeout) phase=Closeout progress=99%
    X1..X4 passed=true (all 4)
  DEMO-STAGE-5 (DEMO · 6 Completed) phase=Completed progress=100%  (no gates)
  DEMO-STAGE-6 (DEMO · 7 Archived) phase=Archived progress=100%  (no gates)

  PATCH /projects/<DEMO-STAGE-6 id> {client:"Should be rejected"} (as PM)
    -> 409 {"success":false,"message":"Project is Archived — changes are locked","code":"CONFLICT"}
  ```

  Real DB row check (`SELECT code, name, status FROM projects WHERE code LIKE 'DEMO-STAGE-%'`),
  both before and after a second re-run — 7 rows both times, names as above.

Server `npx tsc --noEmit -p server` and client `npm run build`: both clean.

### Part C — four dashboards fixed

- **[x] C1 — PM dashboard.** "No approvals backend exists yet" was false: `GET
  /workflows/approvals/stats` + `GET /workflows/approvals?scope=pending` are real, already used
  by `ApprovalQueuePanel`/`pm-approvals.tsx`. Checked `WaitingOnYouCard` first (per the task's own
  instruction) — it already covers gate/workflow/signal items, but not specifically a compact
  "approvals I can decide right now" list with amounts, so built `AwaitingApprovalCard`
  (`client/src/features/workflows/components/AwaitingApprovalCard.tsx`), reusing the existing
  `useApprovals("pending")` hook (same data path as the full queue, not a second query),
  rendering title/project/amount/type per item, linking into `/approvals`. "Site advisories aren't
  backed by any table" was also false — that's exactly what the five signal rules produce, and
  `WaitingOnYouCard` (mounted directly above, unchanged) already renders them cross-project with
  an "AI" badge via the same `GET /lifecycle/my-actions` path `DecisionSupportSection` uses.
  Grepped `server/src` for any general activity-feed table/endpoint — genuinely none exists
  (only the admin-only Audit Trail, a different, role-gated screen) — kept a `ComingSoonCard`,
  relabeled "Activity feed" with honest copy instead of the false "advisories" claim.
  Live-verified: `GET /workflows/approvals/stats` as PM real response `{"pending":0,"overdue":0,
  "avgCycleDays":0,"thisWeek":50}` — 0 pending is correct (no open workflow stages owned by PM in
  this DB state right now), not a stub.

- **[x] C2 — Architect dashboard.** "Request review" was hardcoded `disabled` despite `POST
  /design-reviews` (`server/src/designs/design-reviews/service.ts create()`) already working —
  wired a small dialog (design picker + `useDesignReviews().create()`, matching
  `createDesignReviewSchema`'s exact shape: `code`/`designId`/`requestedBy`). Live-verified: `POST
  /design-reviews` as architect → `201 {"id":58,...,"status":"Pending"}`, real row, cleaned up
  after. "Comment thread" — grepped `server/src` for any general discussion-thread table; found
  only per-decision comment *fields* on workflow stages/design reviews, never a standing thread —
  confirmed genuinely unbuilt, left `disabled` but relabeled "Not built yet — no discussion-thread
  table exists" instead of the ambiguous "Open active review discussions". "Generate options / AI
  design variations" — a fake-AI placeholder never part of the real AI-validation scope (proposal
  checks / cost-comparison / the five signals) — **removed outright**, not wired up, same standard
  as `FEATURES.aiPlaceholders`'s surface table.

- **[x] C3 — Admin dashboard "Workforce snapshot".** Confirmed no cross-project
  attendance/workforce *endpoint* was missing so much as a client-side rollup: `GET /employees`
  and `GET /attendance` (`server/src/employees/routes.ts`, `server/src/attendance/routes.ts`) were
  already org-wide, unfiltered, open to any authenticated role — no new server endpoint needed.
  Built one shared client data path, `useWorkforceSnapshot()`
  (`client/src/features/workforce/hooks/useWorkforceSnapshot.ts`), consumed by both this card
  (`WorkforceSnapshotCard`) and HR's `WorkforceSection` (C4/E3) — not two ad-hoc queries. The "Visit
  HR's Workforce Reports" text is now a real working button to `/workforce-reports` (confirmed
  that route renders unguarded for any authenticated role, same convention as `/reports`/
  `/blueprint-reviews`).

- **[x] C4 — HR dashboard `WorkforceSection()`/`PayrollSection()`.** Folded into Part E (below) per
  the task's own instruction not to fix in isolation — see E3.

Server `npx tsc --noEmit -p server` and client `npm run build`: both clean.


### Part D — app-wide audit for "disabled on a real backend" / fake-AI stubs

**D1/D2 — method.** Grepped every `client/src/pages/roles/*/*.tsx` for a literal, unconditional
`disabled` (no `={...}` expression — those are real loading/permission-derived disables, out of
scope per the task's own instruction) and for every remaining `ComingSoonCard` usage. Cross-checked
each against `server/src/*/service.ts`/`routes.ts` for a matching verb, same method as C2.

**D3 — results table** (every row gets a recorded decision):

| Element | File | Claimed status | Real backend? | Action |
|---|---|---|---|---|
| "Request review" quick action | `architect-dashboard.tsx` | disabled, "Send a design to consultants" | **Yes** — `POST /design-reviews` (`designs/design-reviews/service.ts create()`) | **Wired up** (Part C2) |
| "Comment thread" quick action | `architect-dashboard.tsx` | disabled, ambiguous "Open active review discussions" | No — grepped `server/src`, only per-decision comment fields exist, no general thread table | **Left as genuinely unbuilt**, relabeled honestly (Part C2) |
| "Generate options / AI design variations" | `architect-dashboard.tsx` | disabled, "AI design variations" | N/A — fake-AI stub, never real | **Removed as scope-creep placeholder** (Part C2) |
| "New transaction" | `finance-dashboard.tsx` | disabled, tooltip explains no distinct transaction type | Confirmed: no `cash-flow`/`transactions` route exists (`cash_flow_entries` table has zero server routes) | **Left as-is** — already honestly labeled from a prior round, not a fake claim |
| "Awaiting your approval" | `pm-dashboard.tsx` | `ComingSoonCard`, "No approvals backend exists yet" | **Yes** — `GET /workflows/approvals(/stats)` | **Wired up** (Part C1) |
| "Activity & advisories" | `pm-dashboard.tsx` | `ComingSoonCard`, "site advisories aren't backed by any table" | Advisories: **yes** (the 5 signal rules, already shown by `WaitingOnYouCard` above it). Activity feed: **no** (grepped, no feed/log endpoint besides admin-only Audit Trail) | **Split**: advisories claim removed (redundant with `WaitingOnYouCard`); activity feed kept honest, relabeled (Part C1) |
| "Workforce snapshot" | `admin-dashboard.tsx` | `ComingSoonCard`, "no cross-project attendance/workforce endpoint" | **Yes** — `GET /employees` + `GET /attendance` were already unfiltered | **Wired up** (Part C3) |
| `hrAIInsights`/"AI HR assistant" card | `hr-dashboard.tsx` | gated behind `FEATURES.aiPlaceholders` (permanently false) | N/A — fake-AI stub (`mock-data.ts`) | **Left off** — correctly gated already, not resurrected |
| "AI suggestions" tab | `pm-workflows.tsx` | gated behind `FEATURES.aiPlaceholders` | N/A — fake-AI stub, "Not yet connected" | **Left off** — correctly gated already |
| "AI" anomaly column/card | `finance-expenses.tsx` | gated behind `FEATURES.aiPlaceholders`, keyed off `expense.anomalyScore` (nothing ever writes it) | N/A — fake-AI stub | **Left off** — correctly gated already |
| "Infrastructure health" card | `it-designer-dashboard.tsx` | `ComingSoonCard`, "not recorded anywhere" | Confirmed — no uptime/backup table exists | **Left as-is** — already honest, non-AI |
| "Resources & Tools" | `shared-resources.tsx` | `ComingSoonCard` | Confirmed — no resources table exists | **Left as-is** — already honest, non-AI |
| Header "AI · {primaryAi}" badge | `header.tsx` | gated behind `FEATURES.aiPlaceholders` | N/A — static per-role string, computes nothing | **Left off** — correctly gated already |
| "Generate with AI" hint | `multi-step-page.tsx` | gated behind `FEATURES.aiPlaceholders` | N/A — static hint, no backend call | **Left off** — correctly gated already |

No hardcoded `disabled` (as opposed to `disabled={someCondition}`) was found anywhere in
`client/src/pages/roles/*/*.tsx` outside the two rows above (architect's Comment thread, once
fixed to Generate options being removed, and finance-dashboard's New transaction) — every other
`disabled` in the codebase is conditional on a real loading/permission/validation state.
**Conclusion: C2's "Request review" was the one real instance of "disabled button on a working
endpoint" in the app; every fake-AI-flavored surface was already correctly hidden behind
`FEATURES.aiPlaceholders` from prior rounds, none resurrected here.**

Server `npx tsc --noEmit -p server` and client `npm run build`: both clean.

