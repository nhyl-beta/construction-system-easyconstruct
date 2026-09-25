// server/src/scripts/demo-seed-stages.ts — NEW (demo-and-ux-progress P2-P8)
//
// Creates 7 demo projects, DEMO-STAGE-0 through DEMO-STAGE-6, one per
// lifecycle phase (Proposal, Design, Pre-Construction, Construction,
// Closeout, Completed, Archived), each one built up entirely through real
// API calls against a live dev server — the same shape as
// demo-full-cycle.ts (L5), but stopping seven separate projects at seven
// different points instead of walking one project the whole way.
//
// For every stage except Construction, the project sits in that phase with
// EVERY gate belonging to that phase (and every earlier phase) already
// passing — a "fully qualified to advance, but hasn't been" snapshot, so a
// reviewer can see a complete green checklist for that stage. Construction
// (DEMO-STAGE-3) is deliberately left partial: a realistic ~60% done task
// list (computeProgress's real 30+65*(done/total) formula, not a hardcoded
// progress value), so K1 (all tasks completed) does NOT pass — that's the
// point of a project mid-Construction, not a bug. See demo-and-ux-progress.md
// P1 for exactly which underlying rows each gate reads.
//
// Idempotent: on every run, first deletes all rows (in FK-safe order) for
// project codes DEMO-STAGE-0..6, then rebuilds them from scratch. Safe to
// re-run any number of times.
//
// Prerequisites:
//   - `npm run dev` running against DATABASE_URL (a live server, same as L5)
//   - `npm run db:seed` already applied (demo accounts + workflow templates)
//   - ideally `npm run ai:seed-references` already applied so DEMO-STAGE-3's
//     Budget Change Request line items match a real, broad catalog. If that
//     hasn't been run (or this environment can't reach EstimationPro.ai at
//     all — see demo-and-ux-progress.md's AV-6 deviation), this script seeds
//     one `reference_snapshots` fallback row itself (see ensureFallback
//     ReferenceRow below) so the matcher always has something real to match
//     against — the same low/typical/high values ai-validation/cost.test.ts
//     already uses for its own worked trace, not invented numbers.
//
// Run with: npx tsx src/scripts/demo-seed-stages.ts
import "dotenv/config";
import { db } from "../db/connection.js";
import { sql } from "drizzle-orm";
import { referenceSnapshots } from "../db/schema/ai-validation.js";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8000/api";
const PASSWORD = "Demo@12345";

const STAGE_CODES = [
  "DEMO-STAGE-0",
  "DEMO-STAGE-1",
  "DEMO-STAGE-2",
  "DEMO-STAGE-3",
  "DEMO-STAGE-4",
  "DEMO-STAGE-5",
  "DEMO-STAGE-6",
] as const;

const TARGET_PHASE = [
  "Proposal",
  "Design",
  "Pre-Construction",
  "Construction",
  "Closeout",
  "Completed",
  "Archived",
] as const;

// A1: human-readable display names, "DEMO · N <Phase>", 1-indexed so they
// read naturally ("DEMO · 1 Proposal" .. "DEMO · 7 Archived"). Project
// `name` has no character restriction beyond `min(2)` (see
// project-validator.ts createProjectSchema) so the middle-dot is safe.
// Codes are deliberately left as the existing DEMO-STAGE-0..6 rather than
// renamed to DEMO-S1..7 — those codes are already referenced by
// demo-ai-signals.ts's comments, README.md, and this file's own prior
// progress-doc entries; renaming them would be pure churn with no
// functional benefit now that the *name* (not the code) is what a human
// reads in the UI. See docs/demo-and-ux-progress.md A1 for this decision.
const DISPLAY_NAME = [
  "DEMO · 1 Proposal",
  "DEMO · 2 Design",
  "DEMO · 3 Pre-Construction",
  "DEMO · 4 Construction",
  "DEMO · 5 Closeout",
  "DEMO · 6 Completed",
  "DEMO · 7 Archived",
] as const;

interface Tokens {
  pm: string;
  architect: string;
  consultant: string;
  engineer: string;
  site: string;
  finance: string;
  hr: string;
  admin: string;
}
interface Ids {
  architect: number;
  consultant: number;
  engineer: number;
  site: number;
}

async function login(email: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const json = (await res.json()) as { data?: { token?: string }; message?: string };
  if (!res.ok) throw new Error(`Login failed for ${email}: ${json.message}`);
  return json.data!.token!;
}

async function api<T = any>(
  path: string,
  token: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json()) as { data?: T; message?: string };
  if (!res.ok) {
    throw new Error(`${opts.method ?? "GET"} ${path} -> ${res.status}: ${json.message ?? JSON.stringify(json)}`);
  }
  return json.data as T;
}

let docCounter = 0;
function shortDocId(prefix: string): string {
  docCounter += 1;
  return `${prefix}${docCounter}`.slice(0, 20);
}

// ── Idempotent cleanup ──────────────────────────────────────────────────
// Raw SQL, children before parents. Every table below is either FK-free
// text-matched by project code (no ON DELETE CASCADE exists from a project
// row to its children — see demo-and-ux-progress.md P1) or a child of a
// table already being cleared here. workflows/milestones/designs deletes
// cascade their own dependents automatically (workflow_stages,
// workflow_line_items, validation_results, workflow_attachments,
// milestone_links, design_reviews... no: design_reviews/design_revisions
// are NOT cascade — cleared explicitly below).
async function cleanup(codes: readonly string[]) {
  // `sql.join` builds a real `IN ($1, $2, ...)` list — embedding the JS
  // array directly (`ANY(${codes})`) makes drizzle bind it as a
  // comma-tuple of scalar params instead of a Postgres array, which
  // `ANY()` then rejects.
  const list = () => sql.join(codes.map((c) => sql`${c}`), sql`, `);

  // proposals.workflow_id -> workflows.id has no ON DELETE CASCADE, so the
  // proposal must go first.
  await db.execute(sql`DELETE FROM proposals WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM workflows WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM milestones WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM tasks WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM issues WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM requirements WHERE project IN (${list()})`);
  await db.execute(sql`DELETE FROM documents WHERE project IN (${list()})`);
  await db.execute(sql`DELETE FROM engineering_reports WHERE project IN (${list()})`);
  await db.execute(sql`DELETE FROM blueprints WHERE project_code IN (${list()})`);
  await db.execute(
    sql`DELETE FROM design_reviews WHERE design_id IN (SELECT id FROM designs WHERE project_code IN (${list()}))`,
  );
  await db.execute(
    sql`DELETE FROM design_revisions WHERE design_id IN (SELECT id FROM designs WHERE project_code IN (${list()}))`,
  );
  await db.execute(
    sql`DELETE FROM architect_documents WHERE design_id IN (SELECT id FROM designs WHERE project_code IN (${list()}))`,
  );
  await db.execute(sql`DELETE FROM designs WHERE project_code IN (${list()})`);
  const budgetChildTables = [
    "budget_adjustments",
    "budget_allocations",
    "budget_approval_steps",
    "budget_comments",
    "budget_documents",
    "budget_history",
  ] as const;
  for (const t of budgetChildTables) {
    await db.execute(
      sql`DELETE FROM ${sql.identifier(t)} WHERE budget_id IN (SELECT id FROM budgets WHERE project IN (${list()}))`,
    );
  }
  await db.execute(sql`DELETE FROM budgets WHERE project IN (${list()})`);
  await db.execute(sql`DELETE FROM expenses WHERE project IN (${list()})`);
  await db.execute(sql`DELETE FROM payroll_batches WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM attendance WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM project_members WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM project_phase_history WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM notifications WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM audit_logs WHERE project_code IN (${list()})`);
  await db.execute(sql`DELETE FROM projects WHERE code IN (${list()})`);
}

// If `npm run ai:seed-references` hasn't been run (or can't reach
// EstimationPro.ai — see demo-and-ux-progress.md AV-6), DEMO-STAGE-3's
// Budget Change Request would have nothing to match against and every line
// would be a "no-match". Upserts one row on the same
// (source, source_item_id) conflict key seed-reference-data.ts uses, so a
// later real fetch just overwrites it — this never shadows real data.
async function ensureFallbackReferenceRow() {
  const [existing] = await db.select().from(referenceSnapshots).limit(1);
  if (existing) return;
  console.log(
    "  (no reference_snapshots rows found — seeding one fallback row so the matcher has something real to compare against; run `npm run ai:seed-references` for the full catalog)",
  );
  await db
    .insert(referenceSnapshots)
    .values({
      source: "estimationpro",
      sourceItemId: "rebar-4-half-inch",
      trade: "concrete",
      description: "Rebar #4 (1/2 inch)",
      unit: "lf",
      lowUsd: "80",
      typicalUsd: "100",
      highUsd: "120",
      regionMultiplier: "1",
      volatility: "medium",
      currency: "USD",
      sourceUrl: "https://estimationpro.ai/api/v1/costs?trade=concrete",
      rawPayload: { seeded: "demo-seed-stages fallback — see demo-and-ux-progress.md AV-6" },
    })
    .onConflictDoNothing();
}

function step(label: string) {
  console.log(`  ▶ ${label}`);
}

// ── Phase builders — each returns whatever the next phase needs ─────────

async function staffProject(code: string, t: Tokens, ids: Ids) {
  for (const [role, key, userName] of [
    ["architect", "architect", "Ana Villanueva"],
    ["consultant", "consultant", "Elena Bautista"],
    ["engineer", "engineer", "Paolo Mendoza"],
    ["site-personnel", "site", "Rico Domingo"],
  ] as const) {
    await api("/project-members", t.pm, {
      method: "POST",
      body: { projectCode: code, userId: ids[key], userName, role },
    });
  }
}

// Builds every P1-P5 row. Never calls advance.
async function buildProposalPhase(code: string, t: Tokens) {
  const submitted = await api<{
    proposal: { id: number };
    workflow: { id: number; stages: { id: number; role: string; status: string }[] };
  }>("/proposals/submit", t.architect, {
    method: "POST",
    body: {
      proposalId: `PRP-${code}`,
      title: `${code} design proposal`,
      projectCode: code,
      submittedBy: "Ana Villanueva",
      amount: "500000",
    },
  });
  const consultantStage = submitted.workflow.stages.find((s) => s.role === "consultant")!;
  await api(`/workflows/${submitted.workflow.id}/stages/${consultantStage.id}/decision`, t.consultant, {
    method: "PATCH",
    body: { decision: "approve" },
  });
  const after = await api<{ stages: { id: number; role: string; status: string }[] }>(
    `/workflows/${submitted.workflow.id}`,
    t.pm,
  );
  const pmStage = after.stages.find((s) => s.role === "project-manager")!;
  await api(`/workflows/${submitted.workflow.id}/stages/${pmStage.id}/decision`, t.pm, {
    method: "PATCH",
    body: { decision: "approve" },
  });
  for (const type of ["Notice of Award", "Contract"]) {
    await api("/documents", t.pm, {
      method: "POST",
      body: { documentId: shortDocId("D"), title: type, project: code, type, version: "1.0", uploadedBy: "Miguel Santos" },
    });
  }
}

// Builds every D1-D3 row. Never calls advance.
async function buildDesignPhase(code: string, t: Tokens, ids: Ids) {
  const design = await api<{ id: number }>("/designs", t.architect, {
    method: "POST",
    body: {
      code: `DSN-${code}`,
      name: `${code} structural design`,
      projectCode: code,
      discipline: "Structural",
      category: "Structural",
      leadArchitect: "Ana Villanueva",
      fileUrls: [{ name: "plan.dwg", url: "https://example.com/plan.dwg" }],
      assignedEngineers: [{ userId: ids.engineer, userName: "Paolo Mendoza" }],
    },
  });
  const review = await api<{ id: number }>("/design-reviews", t.consultant, {
    method: "POST",
    body: { code: `REV-${code}`, designId: design.id, requestedBy: "Ana Villanueva" },
  });
  await api(`/design-reviews/${review.id}/decide`, t.consultant, { method: "POST", body: { decision: "Approved" } });
  await api("/blueprints", t.architect, {
    method: "POST",
    body: {
      drawingNumber: `BP-${code}`,
      title: `${code} blueprint`,
      folder: "Structural",
      author: "Ana Villanueva",
      approval: "Approved",
      status: "Current",
      projectCode: code,
      designId: design.id,
    },
  });
  return { designId: design.id };
}

// Builds every C1-C5 row. Never calls advance. Returns the approved budget
// id so Construction (DEMO-STAGE-3) can raise a real Budget Change Request
// against it.
async function buildPreConstructionPhase(code: string, t: Tokens, ids: Ids) {
  for (const category of ["Materials", "Specifications"] as const) {
    const req = await api<{ id: number }>("/requirements", t.engineer, {
      method: "POST",
      body: {
        title: `${category} requirement`,
        project: code,
        category,
        description: `Demo ${category.toLowerCase()} requirement for ${code}`,
        createdBy: "Paolo Mendoza",
      },
    });
    await api(`/requirements/${req.id}`, t.pm, { method: "PATCH", body: { status: "Approved" } });
  }
  const budget = await api<{ id: number }>("/finance/budgets", t.finance, {
    method: "POST",
    body: { project: code, category: "Materials", owner: "Carlo Ramos", planned: 1000000, fiscalYear: "2026" },
  });
  for (const stage of ["draft", "pending-review", "finance-review", "manager-review"] as const) {
    await api("/finance/budget-approval-steps/decide", t.finance, {
      method: "POST",
      body: { budgetId: budget.id, stage, decision: "approved", actor: "Carlo Ramos" },
    });
  }
  const milestone = await api<{ id: number }>("/milestones", t.pm, {
    method: "POST",
    body: { projectCode: code, title: "Foundation complete", estimatedCompletionDate: "2026-12-01" },
  });
  await api(`/milestones/${milestone.id}`, t.pm, { method: "PATCH", body: { status: "active" } });
  const task = await api<{ id: number }>("/tasks", t.pm, {
    method: "POST",
    body: {
      taskCode: `TSK-${code}-0`,
      projectCode: code,
      title: "Pour foundation",
      assignedToUserId: ids.site,
      assignedToName: "Rico Domingo",
      status: "Pending",
      progress: 0,
    },
  });
  await api(`/milestones/${milestone.id}/links`, t.engineer, { method: "POST", body: { linkType: "task", linkId: task.id } });
  await api("/documents", t.pm, {
    method: "POST",
    body: { documentId: shortDocId("N"), title: "Notice to Proceed", project: code, type: "Notice to Proceed", version: "1.0", uploadedBy: "Miguel Santos" },
  });
  await api(`/projects/${await projectIdOf(code, t.pm)}`, t.pm, {
    method: "PATCH",
    body: { siteLatitude: 14.5, siteLongitude: 121.0 },
  });
  return { budgetId: budget.id, milestoneId: milestone.id };
}

async function projectIdOf(code: string, token: string): Promise<number> {
  const list = await api<{ id: number; code: string }[]>(`/projects?code=${encodeURIComponent(code)}`, token);
  const found = Array.isArray(list) ? list.find((p) => p.code === code) : undefined;
  if (found) return found.id;
  // fallback: some list endpoints don't support ?code — scan all projects.
  const all = await api<{ id: number; code: string }[]>("/projects", token);
  const project = all.find((p) => p.code === code);
  if (!project) throw new Error(`Could not resolve project id for ${code}`);
  return project.id;
}

// Construction (DEMO-STAGE-3): a realistic 8-task list, 4 completed — real
// ~60% via computeProgress's 30 + 65*(done/total) formula (30+65*0.5=62.5%,
// rounds to 63) — plus attendance/expense records so Construction views
// aren't empty, plus a real Budget Change Request workflow with 3 line
// items run through the real validateWorkflowLineItems() service
// (FEATURE_AI=true), one in-range, one clearly above-typical, one with no
// quantity. NOT completed (K1-K4 are meant to still fail here).
async function buildConstructionPartial(code: string, t: Tokens, ids: Ids, budgetId: number) {
  const projectId = await projectIdOf(code, t.pm);
  const taskIds: number[] = [];
  for (let i = 1; i <= 8; i++) {
    const task = await api<{ id: number }>("/tasks", t.pm, {
      method: "POST",
      body: {
        taskCode: `TSK-${code}-${i}`,
        projectCode: code,
        title: `Construction task ${i}`,
        assignedToUserId: ids.site,
        assignedToName: "Rico Domingo",
        status: "Pending",
        progress: 0,
      },
    });
    taskIds.push(task.id);
  }
  for (let i = 0; i < 4; i++) {
    await api(`/tasks/${taskIds[i]}/status`, t.site, { method: "PATCH", body: { status: "In Progress" } });
    await api(`/tasks/${taskIds[i]}/status`, t.site, {
      method: "PATCH",
      body: { status: "Completed", completionNote: `Task ${i + 1} finished on schedule` },
    });
  }

  // Attendance so Construction views aren't empty (G1: requires the acting
  // site-personnel to be staffed on this project, project must be
  // Construction/Closeout — both true here).
  await api("/attendance", t.site, {
    method: "POST",
    body: {
      employeeId: "EMP-DEMO-07",
      site: "Main site",
      projectCode: code,
      clockIn: "07:00",
      clockOut: "16:00",
      attendanceStatus: "Present",
      // One employee (EMP-DEMO-07) records attendance across several of
      // these demo projects — the "one clock-in per employee per day"
      // constraint means each project needs its own date.
      logDate: `2026-10-${String(1 + (STAGE_CODES.indexOf(code as (typeof STAGE_CODES)[number]) % 28)).padStart(2, "0")}`,
      photoUrl: "https://example.com/demo-clock-in.jpg",
      latitude: 14.5,
      longitude: 121.0,
    },
  });

  // A "Materials" expense, approved, so it flows into the budget's `spent`.
  const expense = await api<{ id: string }>("/finance/expenses", t.finance, {
    method: "POST",
    body: { vendor: "ABC Hardware Supply", project: code, category: "Materials", amount: 42000 },
  });
  await api(`/finance/expenses/${expense.id}/approve`, t.finance, { method: "PATCH" });

  // Real Budget Change Request workflow, real validateWorkflowLineItems()
  // call via createWorkflow (FEATURE_AI=true + template name match).
  const templates = await api<{ id: number; name: string }[]>("/workflows/templates", t.engineer);
  const bcrTemplateId = templates.find((tpl) => tpl.name === "Budget Change Request")!.id;
  const workflow = await api<{
    id: number;
    aiNote: string | null;
    lineItems: { description: string; validation: { verdict: string; basisSummary: string } | null }[];
  }>("/workflows", t.engineer, {
    method: "POST",
    body: {
      title: `Budget change — rebar quantities (${code})`,
      projectCode: code,
      templateId: bcrTemplateId,
      budgetId,
      amount: 850000,
      lineItems: [
        {
          category: "materials",
          description: "Rebar installation, #4 bar",
          currentAmount: 0,
          requestedAmount: 850000,
          quantity: 128.5,
          unit: "lf",
        },
        {
          category: "materials",
          description: "Rebar installation, #4 bar",
          currentAmount: 0,
          requestedAmount: 8500000,
          quantity: 128.5,
          unit: "lf",
        },
        {
          category: "other",
          description: "Site fencing rental",
          currentAmount: 0,
          requestedAmount: 45000,
        },
      ],
    },
  });

  console.log(`    Budget Change Request workflow ${workflow.id} created. aiNote: "${workflow.aiNote}"`);
  for (const li of workflow.lineItems) {
    console.log(`      line "${li.description}" -> ${li.validation ? `${li.validation.verdict}: ${li.validation.basisSummary}` : "(no validation — FEATURE_AI off?)"}`);
  }

  return { projectId, workflow };
}

// Used from DEMO-STAGE-4 onward: fully completes Construction (K1-K4) so
// advance() to Closeout is legitimately allowed. Reuses the same 8-task
// list shape as buildConstructionPartial but finishes every task, closes
// the milestone, resolves an issue, and lets any workflows finish.
async function buildConstructionComplete(code: string, t: Tokens, ids: Ids, milestoneId: number, budgetId: number) {
  const { workflow } = await buildConstructionPartial(code, t, ids, budgetId);
  // Finish the remaining 4 tasks.
  const tasks = await api<{ id: number; status: string }[]>(`/tasks?projectCode=${code}`, t.pm);
  for (const task of tasks) {
    if (task.status !== "Completed") {
      await api(`/tasks/${task.id}/status`, t.site, { method: "PATCH", body: { status: "In Progress" } }).catch(() => {});
      await api(`/tasks/${task.id}/status`, t.site, {
        method: "PATCH",
        body: { status: "Completed", completionNote: "Completed for closeout" },
      });
    }
  }
  await api(`/milestones/${milestoneId}`, t.pm, { method: "PATCH", body: { status: "completed" } });
  const issue = await api<{ id: number }>("/issues", t.engineer, {
    method: "POST",
    body: { issueCode: `ISS-${code}`, projectCode: code, title: "Minor rebar spacing deviation", description: "Spacing on grid line 4 slightly out of tolerance, corrected on site" },
  });
  await api(`/issues/${issue.id}/status`, t.pm, { method: "PATCH", body: { status: "Resolved", resolutionNotes: "Re-inspected and corrected on site" } });
  // Walk the Budget Change Request workflow to completion so K4 (no active
  // workflows) passes too.
  const stagesList = await api<{ stages: { id: number; role: string; status: string }[] }>(`/workflows/${workflow.id}`, t.pm);
  const roleToken: Record<string, string> = { "finance-manager": t.finance, "project-manager": t.pm, admin: t.admin };
  let current = stagesList.stages.find((s) => s.status === "current");
  while (current) {
    const actor = roleToken[current.role] ?? t.admin;
    await api(`/workflows/${workflow.id}/stages/${current.id}/decision`, actor, { method: "PATCH", body: { decision: "approve" } });
    const refreshed = await api<{ stages: { id: number; role: string; status: string }[] }>(`/workflows/${workflow.id}`, t.pm);
    current = refreshed.stages.find((s) => s.status === "current");
  }
}

// Builds every X1-X4 row. Never calls advance beyond Closeout.
async function buildCloseoutPhase(code: string, t: Tokens) {
  const report = await api<{ id: number }>("/engineering-reports", t.engineer, {
    method: "POST",
    body: {
      title: "Final inspection",
      type: "Final Inspection",
      project: code,
      location: "Site",
      date: "2026-12-15",
      engineer: "Paolo Mendoza",
      description: "Final walkthrough of completed works",
      findings: "All systems inspected and functioning as designed",
      recommendations: "Approve for closeout",
    },
  });
  await api(`/engineering-reports/${report.id}`, t.pm, { method: "PATCH", body: { status: "Approved" } });
  await api("/documents", t.pm, {
    method: "POST",
    body: { documentId: shortDocId("C"), title: "Certificate of Completion", project: code, type: "Certificate of Completion", version: "1.0", uploadedBy: "Miguel Santos" },
  });
  const closeoutTemplates = await api<{ id: number; name: string }[]>("/workflows/templates", t.engineer);
  const closeoutTemplateId = closeoutTemplates.find((tpl) => tpl.name === "Project Closeout")!.id;
  const closeoutWf = await api<{ id: number; stages: { id: number; role: string; status: string }[] }>("/workflows", t.engineer, {
    method: "POST",
    body: { title: `Closeout ${code}`, projectCode: code, templateId: closeoutTemplateId },
  });
  const roleToken: Record<string, string> = { "finance-manager": t.finance, "project-manager": t.pm, admin: t.admin };
  for (const role of ["finance-manager", "project-manager", "admin"] as const) {
    const stages = await api<{ stages: { id: number; role: string; status: string }[] }>(`/workflows/${closeoutWf.id}`, t.pm);
    const stage = stages.stages.find((s) => s.role === role && s.status === "current")!;
    await api(`/workflows/${closeoutWf.id}/stages/${stage.id}/decision`, roleToken[role]!, { method: "PATCH", body: { decision: "approve" } });
  }
  const payroll = await api<{ batch: { id: string } }>("/payroll/generate", t.hr, {
    method: "POST",
    body: { period: `Closeout ${code}`, projectCode: code, entries: [{ employeeId: "EMP-DEMO-07", hoursWorked: 8 }] },
  });
  await api(`/finance/payroll-review/${payroll.batch.id}/decide`, t.finance, {
    method: "POST",
    body: { decision: "approved", reviewedBy: "Carlo Ramos" },
  });
}

async function advance(projectId: number, t: Tokens) {
  return api<{ phase: string; progress: number }>(`/projects/${projectId}/lifecycle/advance`, t.pm, {
    method: "POST",
    body: {},
  });
}

async function main() {
  console.log("Cleaning up any existing DEMO-STAGE-* rows (idempotent re-run)...");
  await cleanup(STAGE_CODES);
  await ensureFallbackReferenceRow();

  console.log("Logging in every role...");
  const t: Tokens = {
    pm: await login("pm@easyconstruct.demo"),
    architect: await login("architect@easyconstruct.demo"),
    consultant: await login("consultant@easyconstruct.demo"),
    engineer: await login("engineer@easyconstruct.demo"),
    site: await login("site@easyconstruct.demo"),
    finance: await login("finance@easyconstruct.demo"),
    hr: await login("hr@easyconstruct.demo"),
    admin: await login("admin@easyconstruct.demo"),
  };
  const users = await api<{ id: number; name: string; email: string }[]>("/users", t.admin);
  const byEmail = (email: string) => users.find((u) => u.email === email)!.id;
  const ids: Ids = {
    architect: byEmail("architect@easyconstruct.demo"),
    consultant: byEmail("consultant@easyconstruct.demo"),
    engineer: byEmail("engineer@easyconstruct.demo"),
    site: byEmail("site@easyconstruct.demo"),
  };

  const summary: { code: string; targetPhase: string; finalPhase: string; progress: number }[] = [];

  for (let i = 0; i < STAGE_CODES.length; i++) {
    const code = STAGE_CODES[i]!;
    const target = TARGET_PHASE[i]!;
    console.log(`\n=== ${code} → ${target} ===`);

    const project = await api<{ id: number; code: string }>("/projects", t.pm, {
      method: "POST",
      body: {
        name: DISPLAY_NAME[i]!,
        code,
        pm: "Miguel Santos",
        due: "2027-06-30",
        client: "Demo Client",
        // A4: the Construction-stage project is the one that also carries a
        // real Budget Change Request through validateWorkflowLineItems() —
        // point at the separate AISIG-DEMO scenario (all five signal rules)
        // right in the description so "see everything AI-validation does"
        // is reachable from either bookmarkable project.
        description:
          code === "DEMO-STAGE-3"
            ? "Demonstrates the real cost-comparison engine (EstimationPro.ai citations on a Budget Change Request). For the five decision-support signal rules firing together, see the AISIG-DEMO project."
            : undefined,
      },
    });
    step(`Created project ${code} (id ${project.id})`);
    await staffProject(code, t, ids);

    let budgetId: number | undefined;
    let milestoneId: number | undefined;

    step("Proposal phase (P1-P5)");
    await buildProposalPhase(code, t);
    await api(`/projects/${project.id}`, t.pm, { method: "PATCH", body: { contractValue: 500000 } });
    if (target === "Proposal") {
      const view = await api<{ phase: string; progress: number }>(`/projects/${project.id}/lifecycle`, t.pm);
      summary.push({ code, targetPhase: target, finalPhase: view.phase, progress: view.progress });
      continue;
    }
    await advance(project.id, t);

    step("Design phase (D1-D3)");
    await buildDesignPhase(code, t, ids);
    if (target === "Design") {
      const view = await api<{ phase: string; progress: number }>(`/projects/${project.id}/lifecycle`, t.pm);
      summary.push({ code, targetPhase: target, finalPhase: view.phase, progress: view.progress });
      continue;
    }
    await advance(project.id, t);

    step("Pre-Construction phase (C1-C5)");
    const pre = await buildPreConstructionPhase(code, t, ids);
    budgetId = pre.budgetId;
    milestoneId = pre.milestoneId;
    if (target === "Pre-Construction") {
      const view = await api<{ phase: string; progress: number }>(`/projects/${project.id}/lifecycle`, t.pm);
      summary.push({ code, targetPhase: target, finalPhase: view.phase, progress: view.progress });
      continue;
    }
    await advance(project.id, t);

    step("Construction phase");
    if (target === "Construction") {
      await buildConstructionPartial(code, t, ids, budgetId!);
      const view = await api<{ phase: string; progress: number }>(`/projects/${project.id}/lifecycle`, t.pm);
      summary.push({ code, targetPhase: target, finalPhase: view.phase, progress: view.progress });
      continue;
    }
    await buildConstructionComplete(code, t, ids, milestoneId!, budgetId!);
    await advance(project.id, t);

    step("Closeout phase (X1-X4)");
    await buildCloseoutPhase(code, t);
    if (target === "Closeout") {
      const view = await api<{ phase: string; progress: number }>(`/projects/${project.id}/lifecycle`, t.pm);
      summary.push({ code, targetPhase: target, finalPhase: view.phase, progress: view.progress });
      continue;
    }
    await advance(project.id, t);

    if (target === "Completed") {
      const view = await api<{ phase: string; progress: number }>(`/projects/${project.id}/lifecycle`, t.pm);
      summary.push({ code, targetPhase: target, finalPhase: view.phase, progress: view.progress });
      continue;
    }

    step("Archive (Admin)");
    await api(`/projects/${project.id}/lifecycle/archive`, t.admin, { method: "POST", body: {} });
    const view = await api<{ phase: string; progress: number }>(`/projects/${project.id}/lifecycle`, t.pm);
    summary.push({ code, targetPhase: target, finalPhase: view.phase, progress: view.progress });
  }

  console.log("\n=== Summary ===");
  for (const row of summary) {
    console.log(`  ${row.code.padEnd(14)} target=${row.targetPhase.padEnd(16)} actual phase=${row.finalPhase.padEnd(16)} progress=${row.progress}%`);
  }
}

main()
  .catch((err) => {
    console.error("\n✘ demo-seed-stages failed:", err.message);
    if (err.cause) console.error("cause:", err.cause);
    process.exitCode = 1;
  })
  .finally(() => {
    // db is a pg Pool-backed drizzle instance; let the process exit
    // naturally rather than forcing pool.end() here, since ai-validation's
    // own cache module may still hold an in-flight promise.
    setTimeout(() => process.exit(process.exitCode ?? 0), 250);
  });
