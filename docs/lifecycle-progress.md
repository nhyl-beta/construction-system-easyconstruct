# Project Lifecycle — Progress

Branch: `feature/project-lifecycle`

Group A commit: `379923e`. Group B commit: `71036b0`.

## Checklist

### A. Fix first
- [x] A1 🔴 Require login on Finance and Engineering Reports — `app.use("/api/finance", authenticate, financeRouter)`; requireRole("finance-manager","admin") on all finance write routes; `authenticate` + role guards on engineering-reports routes.
- [x] A2 🔴 Requirements: engineer create/Under Review, PM/admin approve/reject — `assertCanSetStatus` in requirements/service.ts, route guards in requirements/routes.ts.
- [x] A3 🔴 Fix notifications (recipient_user_id, project_code, link columns; scope GET by authUser) — schema + ensure-demo-schema.ts migration, repository.findForRecipient ignores `?role=`.
- [x] A4 🔴 Feature flag FEATURES.ai (server + client), default off — server/src/config/features.ts, client/src/config/features.ts.

### B. Hide AI (flag off)
- [x] B1 🔴 proposals/service.ts skip validateProposal when !FEATURES.ai — also now rejects unknown project codes directly (ValidationError) instead of only via the hidden aiValidation issue.
- [x] B2 🔴 Hide AI validation UI (ProposalsRegister, architect-proposals, consultant-proposals)
- [x] B3 🔴 Remove AI completeness/confidence inputs (architect-design-create/detail) — wizard step and detail-page bars removed, columns kept (always written as 0).
- [x] B4 🔴 Hide "AI note" (WorkflowCard, approval-queue-panel)
- [x] B5 🔴 Remove AI Insights surfaces (role-resources, App.tsx redirect, finance ai hooks) — also fixed a real bug found along the way: use-finance-dashboard.ts used raw `fetch()` with no auth header, which A1's new `authenticate` gate would have 401'd; switched to apiClient.
- [x] B6 🟡 Hide AI HR assistant card (hr-dashboard)
- [x] B7 🟡 Grepped for remaining "AI" strings. Gated (flag-off hides): header.tsx "AI · {primaryAi}" badge (every role, every page — the biggest survivor found), role-tab.ts "AI Insights" nav entries (5), multi-step-page.tsx "Generate with AI" hint box (shared by ProjectCreatePage + EmployeeCreatePage), consultant-dashboard.tsx / pm-dashboard.tsx "AI insights" ComingSoonCards, pm-workflows.tsx "AI suggestions" tab, finance-expenses.tsx AI column + "AI anomaly detection" card.
  Left as-is (deviation, logged below): finance-expenses.tsx page description text, finance-reports.tsx "Forecast Reports" card description, architect-dashboard.tsx disabled "Generate options / AI design variations" quick-action, mock-data.ts internal AI-labeled entries, orphaned/unrouted pages (shared-ai-insights.tsx, pm-ai-insights.tsx, finance-ai-insight.tsx — none reachable via any route after App.tsx's redirect), providers/resources.ts ai-insights resource registration (Refine internal, not rendered as nav).

**→ CHECKPOINT 1**

### C. Lifecycle core
- [ ] C1 🔴 server/src/lifecycle/phases.ts
- [ ] C2 🔴 Schema: projects columns + project_phase_history table + status migration
- [ ] C3 🔴 project-validator.ts: status/progress rejected on update, forced on create; remove progress from ENGINEER_UPDATABLE_FIELDS
- [ ] C4 🔴 lifecycle/gates.ts + lifecycle/repository.ts loadSnapshot
- [ ] C5 🔴 lifecycle/service.ts computeProgress/refreshProjectProgress; delete recomputeProjectProgress from workflows/service.ts
- [ ] C6 🔴 GET .../lifecycle and POST .../lifecycle/advance
- [ ] C7 🔴 refreshProjectProgress call sites (tasks, milestones, links, requirements, budgets, documents, designs, reviews, blueprints, members, workflows, payroll, eng reports)
- [ ] C8 🔴 assertProjectWritable guard on writes
- [ ] C9 🔴 Client features/lifecycle/ (types, repo, hook, ProjectLifecyclePanel)
- [ ] C10 🔴 ProjectDetailPage: status read-only badge, remove progress input/engineer save
- [ ] C11 🟡 Hold/Resume/Cancel endpoints + menu
- [ ] C12 🟡 Project list phase column/filter, Archived hidden by default

**→ CHECKPOINT 2** (curl transcript of blocked advance 409)

### D. Phase 1 — Proposal
- [ ] D1 🔴 ProjectCreatePage: drop status:"Planning"; require Architect+Consultant in Team step
- [ ] D2 🔴 proposals.workflow_id + POST /api/proposals/submit
- [ ] D3 🔴 decideStage syncs linked proposal status; consultant review routes through workflow
- [ ] D4 🔴 POST /api/workflows/:id/stages/:stageId/resubmit + client Resubmit button
- [ ] D5 🔴 New document types
- [ ] D6 🟡 "Mark bid lost" action on rejected proposal workflow

### E. Phase 2 — Design
- [ ] E1 🔴 design-reviews decide guard + design status sync + notify architect; guard designs writes
- [ ] E2 🔴 Decide-review UI (consultant or PM)
- [ ] E3 🔴 blueprints.project_code + design_id, ProjectPicker, list filter
- [ ] E4 🟡 assignedEngineerId must be staffed engineer

### F. Phase 3 — Pre-Construction
- [ ] F1 🔴 PM approve/reject requirements UI
- [ ] F2 🔴 Finance budget create/approve flow works end to end; fix stale validator message
- [ ] F3 🔴 MilestonesPanel: PM/Admin set status + edit date
- [ ] F4 🔴 Milestone links API + task-create milestone select
- [ ] F5 🔴 C4 fully implemented with detail naming
- [ ] F6 🔴 Project detail PM edits site lat/long/radius
- [ ] F7 🟡 IT Designer "staffed but no login/employee" list

**→ CHECKPOINT 3**

### G. Phase 4 — Construction
- [ ] G1 🔴 Attendance clock-in guard (projectCode, staffed site-personnel, Construction/Closeout)
- [ ] G2 🔴 Task create/complete refresh + notify; milestone-ready notice
- [ ] G3 🔴 Issues resolve requires resolutionNotes; notify reporter
- [ ] G4 🔴 Budget Change Request completion → budgets.planned + budget_adjustments row
- [ ] G5 🔴 Payroll project picker + prefill from verified attendance; approved batch → Labor actual
- [ ] G6 🟡 Approved expense → budget actual
- [ ] G7 🟡 (merged into G2)
- [ ] G8 🟡 Issue detail "Create corrective task"
- [ ] G9 🟢 Project detail activity feed

### H. Phase 5 — Closeout
- [ ] H1 🔴 Final Inspection engineering report type
- [ ] H2 🔴 COC upload confirmed
- [ ] H3 🔴 Seed Project Closeout template; Engineer starts only in Closeout
- [ ] H4 🔴 Finance closeout stage refused with pending expenses; planned vs actual view
- [ ] H5 🔴 Advance to Completed sets completed_at, notifies Owner+members
- [ ] H6 🟡 closeout-summary endpoint + page
- [ ] H7 🟢 Architect uploads As-Built Drawing

### I. Archive
- [ ] I1 🔴 /archive endpoint (Admin, from Completed)

**→ CHECKPOINT 4**

### J. Notifications
- [ ] J1 🔴 notifyProject(projectCode, roles, {title, body, link})
- [ ] J2 🔴 Fire every event in 4.5
- [ ] J3 🔴 Bell reads fixed endpoint; click marks read + navigates

### K. Role screens
- [ ] K1 🔴 GET /api/lifecycle/my-actions + WaitingOnYouCard on dashboards
- [ ] K2 🟡 Owner portfolio phase badge/%%/Completed filter/closeout-summary link
- [ ] K3 🟡 Audit-log screen filter by project code

### L. Tests and demo
- [ ] L1 🔴 Seed: closeout template, demo accounts linked to employees, refreshProjectProgress for all
- [ ] L2 🔴 Node test runner: lifecycle/gates.test.ts, lifecycle/progress.test.ts
- [ ] L3 🔴 API-level tests/curl (403/409/401 cases)
- [ ] L4 🔴 Walkthrough run against fresh seed, record actual %
- [ ] L5 🟡 demo-full-cycle.ts script

**→ CHECKPOINT 5 (final)**

## Deviations

- `docs/` is gitignored repo-wide (`.gitignore`: "Ignore docs"). Force-added this one file (`git add -f`) since the working protocol requires it to carry commit hashes across sessions/checkpoints — everything else under `docs/` stays ignored.
- Spec's `ValidationError` is described as a 422; the codebase's existing `ValidationError` (server/src/utils/errors.ts) is a 400. Kept the code's 400 rather than changing a class used everywhere else in the app (ground rule: trust the code).
- No `.env.example` file exists anywhere in the repo (checked both `server/` and `client/`), so A4's "add both variables to any .env.example" had nothing to add to. `FEATURE_AI` (server) / `VITE_FEATURE_AI` (client) both default falsy via `!== "true"`, so no env file is required for the flag to be off.
- B7 (🟡): left several minor/cosmetic "AI" strings ungated rather than touching every occurrence — see the B7 checklist note above for the specific list and why each was left (unrouted dead pages, plain descriptive copy, an already-`disabled` placeholder button, internal mock-data labels, Refine's internal resource registry).
- A2/F1 split: the spec puts "PM approve/reject requirements UI" in F1, so A2 only added the backend guard (`assertCanSetStatus`) — there is currently no client UI that can even attempt an Approved/Rejected requirement PATCH yet (engineer-requirements.tsx only creates drafts). Verified the guard directly.

## Questions

(none yet)
