// server/src/scripts/demo-ai-signals.ts — NEW (ai-signals F2)
//
// Drives one project into Construction (reusing demo-full-cycle.ts's own
// steps for Proposal/Design/Pre-Construction, since the signals need real
// gate-check data to exist), then deliberately engineers a scenario that
// should trip all five signal rules, and asserts the live API actually
// reports each one at its expected severity.
//
// Also asserts the core "decision support never blocks" guarantee: the
// gate checks and canAdvance this script gets back from the live server
// (running with FEATURE_AI=true) are byte-for-byte what evaluateGate/the
// canAdvance formula compute directly — the same code path a flag-off
// server would run, since gates.ts never imports signals at all
// (enforced in code by lifecycle/boundary.test.ts).
//
// Prerequisites: `npm run dev` running with FEATURE_AI=true, `npm run
// db:seed` and `npm run ai:seed-references` already applied.
// Run with: npx tsx src/scripts/demo-ai-signals.ts
import "dotenv/config";
import pg from "pg";
import { loadSnapshot } from "../lifecycle/repository.js";
import { evaluateGate } from "../lifecycle/gates.js";
import { NEXT_PHASE, isSequencedPhase, type SequencedPhase } from "../lifecycle/phases.js";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8000/api";
const PASSWORD = "Demo@12345";
// A4 (docs/ai-signals-progress.md F2 originally left this as a
// timestamp-suffixed code, e.g. AISIG-MUGLM73Z, generated fresh on every
// run and never cleaned up — a new, differently-coded "permanent artifact"
// each time, which is not actually bookmarkable. Fixed to a single stable
// code (overridable via AISIG_PROJECT_CODE) plus the cleanupExisting() call
// below, so this script is idempotent like demo-seed-stages.ts: re-running
// it always rebuilds the *same* project, and its code can be linked to
// directly (see README's "Demo data" section).
const PROJECT_CODE = process.env.AISIG_PROJECT_CODE ?? "AISIG-DEMO";
const CONTRACT_VALUE = 1_000_000;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

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

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.error(`  ✘ ${name}`, detail ?? "");
  }
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

async function api<T = any>(path: string, token: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json()) as { data?: T; message?: string };
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${path} -> ${res.status}: ${json.message ?? JSON.stringify(json)}`);
  return json.data as T;
}

function step(label: string) {
  console.log(`\n▶ ${label}`);
}

// A4: raw-SQL teardown for one project code, same table order (children
// before parents) as demo-seed-stages.ts's own `cleanup()` — kept as a
// separate, self-contained copy rather than importing that module, since
// its main() runs unconditionally at import time (it would reseed all 7
// DEMO-STAGE-* projects as an unwanted side effect of importing it here).
async function cleanupExisting(code: string) {
  await pool.query("DELETE FROM proposals WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM workflows WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM milestones WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM tasks WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM issues WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM requirements WHERE project = $1", [code]);
  await pool.query("DELETE FROM documents WHERE project = $1", [code]);
  await pool.query("DELETE FROM engineering_reports WHERE project = $1", [code]);
  await pool.query("DELETE FROM blueprints WHERE project_code = $1", [code]);
  await pool.query(
    "DELETE FROM design_reviews WHERE design_id IN (SELECT id FROM designs WHERE project_code = $1)",
    [code],
  );
  await pool.query(
    "DELETE FROM design_revisions WHERE design_id IN (SELECT id FROM designs WHERE project_code = $1)",
    [code],
  );
  await pool.query(
    "DELETE FROM architect_documents WHERE design_id IN (SELECT id FROM designs WHERE project_code = $1)",
    [code],
  );
  await pool.query("DELETE FROM designs WHERE project_code = $1", [code]);
  for (const t of [
    "budget_adjustments",
    "budget_allocations",
    "budget_approval_steps",
    "budget_comments",
    "budget_documents",
    "budget_history",
  ]) {
    await pool.query(
      `DELETE FROM ${t} WHERE budget_id IN (SELECT id FROM budgets WHERE project = $1)`,
      [code],
    );
  }
  await pool.query("DELETE FROM budgets WHERE project = $1", [code]);
  await pool.query("DELETE FROM expenses WHERE project = $1", [code]);
  await pool.query("DELETE FROM payroll_batches WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM attendance WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM project_members WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM project_phase_history WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM notifications WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM audit_logs WHERE project_code = $1", [code]);
  await pool.query("DELETE FROM projects WHERE code = $1", [code]);
}

let docCounter = 0;
function shortDocId(): string {
  docCounter += 1;
  return `DOC-${Date.now().toString(36).slice(-6).toUpperCase()}${docCounter}`;
}

async function main() {
  step("Logging in every role");
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

  step(`Clearing any existing ${PROJECT_CODE} from a previous run`);
  await cleanupExisting(PROJECT_CODE);

  step(`Creating project ${PROJECT_CODE} and driving it to Construction`);
  const project = await api<{ id: number; code: string }>("/projects", t.pm, {
    method: "POST",
    body: { name: "AI Signals Demo", code: PROJECT_CODE, pm: "Miguel Santos", due: "2026-12-31", client: "Demo Client" },
  });
  const projectId = project.id;

  for (const [role, userIdKey, userName] of [
    ["architect", "architect", "Ana Villanueva"],
    ["consultant", "consultant", "Elena Bautista"],
    ["engineer", "engineer", "Paolo Mendoza"],
    ["site-personnel", "site", "Rico Domingo"],
  ] as const) {
    await api("/project-members", t.pm, { method: "POST", body: { projectCode: PROJECT_CODE, userId: ids[userIdKey], userName, role } });
  }

  // ── Proposal ──────────────────────────────────────────────────────────
  const submitted = await api<{ workflow: { id: number; stages: { id: number; role: string }[] } }>("/proposals/submit", t.architect, {
    method: "POST",
    body: { proposalId: `PRP-${PROJECT_CODE}`, title: "AI signals demo proposal", projectCode: PROJECT_CODE, submittedBy: "Ana Villanueva", amount: String(CONTRACT_VALUE) },
  });
  const consultantStage = submitted.workflow.stages.find((s) => s.role === "consultant")!;
  await api(`/workflows/${submitted.workflow.id}/stages/${consultantStage.id}/decision`, t.consultant, { method: "PATCH", body: { decision: "approve" } });
  const afterConsultant = await api<{ stages: { id: number; role: string }[] }>(`/workflows/${submitted.workflow.id}`, t.pm);
  const pmStage = afterConsultant.stages.find((s) => s.role === "project-manager")!;
  await api(`/workflows/${submitted.workflow.id}/stages/${pmStage.id}/decision`, t.pm, { method: "PATCH", body: { decision: "approve" } });
  for (const type of ["Notice of Award", "Contract"]) {
    await api("/documents", t.pm, { method: "POST", body: { documentId: shortDocId(), title: type, project: PROJECT_CODE, type, version: "1.0", uploadedBy: "Miguel Santos" } });
  }
  await api(`/projects/${projectId}`, t.pm, { method: "PATCH", body: { contractValue: CONTRACT_VALUE } });
  await api(`/projects/${projectId}/lifecycle/advance`, t.pm, { method: "POST", body: {} });

  // ── Design ────────────────────────────────────────────────────────────
  const design = await api<{ id: number }>("/designs", t.architect, {
    method: "POST",
    body: { code: `DSN-${PROJECT_CODE}`, name: "AI signals demo design", projectCode: PROJECT_CODE, discipline: "Structural", category: "Structural", leadArchitect: "Ana Villanueva", fileUrls: [{ name: "plan.dwg", url: "https://example.com/plan.dwg" }], assignedEngineers: [{ userId: ids.engineer, userName: "Paolo Mendoza" }] },
  });
  const review = await api<{ id: number }>("/design-reviews", t.consultant, { method: "POST", body: { code: `REV-${PROJECT_CODE}`, designId: design.id, requestedBy: "Ana Villanueva" } });
  await api(`/design-reviews/${review.id}/decide`, t.consultant, { method: "POST", body: { decision: "Approved" } });
  await api("/blueprints", t.architect, { method: "POST", body: { drawingNumber: `BP-${PROJECT_CODE}`, title: "AI signals demo blueprint", folder: "Structural", author: "Ana Villanueva", approval: "Approved", status: "Current", projectCode: PROJECT_CODE, designId: design.id } });
  await api(`/projects/${projectId}/lifecycle/advance`, t.pm, { method: "POST", body: {} });

  // ── Pre-Construction ─────────────────────────────────────────────────
  for (const category of ["Materials", "Specifications"] as const) {
    const req = await api<{ id: number }>("/requirements", t.engineer, { method: "POST", body: { title: `${category} requirement`, project: PROJECT_CODE, category, description: `Demo ${category.toLowerCase()} requirement`, createdBy: "Paolo Mendoza" } });
    await api(`/requirements/${req.id}`, t.pm, { method: "PATCH", body: { status: "Approved" } });
  }
  const budget1 = await api<{ id: number }>("/finance/budgets", t.finance, { method: "POST", body: { project: PROJECT_CODE, category: "Materials", owner: "Carlo Ramos", planned: 100_000, fiscalYear: "2026" } });
  for (const stage of ["draft", "pending-review", "finance-review", "manager-review"] as const) {
    await api("/finance/budget-approval-steps/decide", t.finance, { method: "POST", body: { budgetId: budget1.id, stage, decision: "approved", actor: "Carlo Ramos" } });
  }
  const milestone = await api<{ id: number }>("/milestones", t.pm, { method: "POST", body: { projectCode: PROJECT_CODE, title: "Foundation complete", estimatedCompletionDate: "2026-11-01" } });
  await api(`/milestones/${milestone.id}`, t.pm, { method: "PATCH", body: { status: "active" } });
  const seedTask = await api<{ id: number }>("/tasks", t.pm, { method: "POST", body: { taskCode: `TSK-${PROJECT_CODE}-0`, projectCode: PROJECT_CODE, title: "Seed task", assignedToUserId: ids.site, assignedToName: "Rico Domingo", status: "Pending", progress: 0 } });
  await api(`/milestones/${milestone.id}/links`, t.engineer, { method: "POST", body: { linkType: "task", linkId: seedTask.id } });
  await api("/documents", t.pm, { method: "POST", body: { documentId: shortDocId(), title: "Notice to Proceed", project: PROJECT_CODE, type: "Notice to Proceed", version: "1.0", uploadedBy: "Miguel Santos" } });
  await api(`/projects/${projectId}`, t.pm, { method: "PATCH", body: { siteLatitude: 14.5, siteLongitude: 121.0 } });
  await api(`/projects/${projectId}/lifecycle/advance`, t.pm, { method: "POST", body: {} });

  console.log(`  Project ${PROJECT_CODE} (id ${projectId}) is now in Construction.`);

  // ── Scenario: engineer every signal rule ────────────────────────────────

  step("1. Budget Change Request: one matchable/within-range line, one wildly above-typical line, one no-quantity line");
  const bcr = await api<{ id: number; stages: { id: number; role: string; status: string }[] }>("/workflows", t.engineer, {
    method: "POST",
    body: {
      title: "AI signals demo budget change",
      projectCode: PROJECT_CODE,
      templateId: (await api<{ id: number; name: string }[]>("/workflows/templates", t.engineer)).find((tpl) => tpl.name === "Budget Change Request")!.id,
      lineItems: [
        { category: "materials", description: "Ready-mix concrete (3000-4000 PSI), delivered", currentAmount: 0, requestedAmount: 95_000, quantity: 10, unit: "cy" },
        { category: "materials", description: "Concrete slab, poured and finished", currentAmount: 0, requestedAmount: 500_000, quantity: 500, unit: "sqft" },
        { category: "other", description: "Miscellaneous sitework contingency", currentAmount: 0, requestedAmount: 20_000 },
      ],
    },
  });
  console.log(`  Raised ${bcr.id} — expect cost-variance (above-typical, critical) on the slab line.`);

  step("2. Approve a second budget line to push planned to 15% over contract value");
  const budget2 = await api<{ id: number }>("/finance/budgets", t.finance, { method: "POST", body: { project: PROJECT_CODE, category: "Materials", owner: "Carlo Ramos", planned: 1_050_000, fiscalYear: "2026" } });
  for (const stage of ["draft", "pending-review", "finance-review", "manager-review"] as const) {
    await api("/finance/budget-approval-steps/decide", t.finance, { method: "POST", body: { budgetId: budget2.id, stage, decision: "approved", actor: "Carlo Ramos" } });
  }
  console.log("  Total planned now 1,150,000 against a 1,000,000 contract value — expect cumulative-change-impact (warn, +15%).");

  step("3. Complete 1 of 4 tasks (25% completion), approve a large expense (burn far ahead of completion)");
  const tasks: { id: number }[] = [seedTask];
  for (let i = 1; i <= 3; i++) {
    tasks.push(await api<{ id: number }>("/tasks", t.pm, { method: "POST", body: { taskCode: `TSK-${PROJECT_CODE}-${i}`, projectCode: PROJECT_CODE, title: `Task ${i}`, assignedToUserId: ids.site, assignedToName: "Rico Domingo", status: "Pending", progress: 0 } }));
  }
  await api(`/tasks/${tasks[0]!.id}/status`, t.site, { method: "PATCH", body: { status: "In Progress" } });
  await api(`/tasks/${tasks[0]!.id}/status`, t.site, { method: "PATCH", body: { status: "Completed", completionNote: "Done" } });
  const expense = await api<{ id: string }>("/finance/expenses", t.finance, { method: "POST", body: { vendor: "Demo Supplier", project: PROJECT_CODE, category: "Materials", amount: 632_500 } });
  await api(`/finance/expenses/${expense.id}/approve`, t.finance, { method: "PATCH", body: {} });
  console.log("  1 of 4 tasks complete (25%), ~55% of planned budget spent — expect burn-vs-progress (warn, ~30-point divergence).");

  step("4. File 3 Material issues on this project, one already resolved with a note");
  const resolvedIssue = await api<{ id: number }>("/issues", t.engineer, { method: "POST", body: { issueCode: `ISS-${PROJECT_CODE}-1`, projectCode: PROJECT_CODE, title: "Cracked batch of tiles", description: "Delivered tile batch had visible cracking", category: "Material" } });
  await api(`/issues/${resolvedIssue.id}/status`, t.pm, { method: "PATCH", body: { status: "Resolved", resolutionNotes: "Replaced with a batch from a different supplier." } });
  await api("/issues", t.engineer, { method: "POST", body: { issueCode: `ISS-${PROJECT_CODE}-2`, projectCode: PROJECT_CODE, title: "Second material defect", description: "A second, unrelated defect", category: "Material" } });
  await api("/issues", t.engineer, { method: "POST", body: { issueCode: `ISS-${PROJECT_CODE}-3`, projectCode: PROJECT_CODE, title: "Third material defect", description: "A third, unrelated defect", category: "Material" } });
  console.log("  3 Material issues in the last 30 days (1 resolved with a note) — expect issue-recurrence (warn, with a precedent).");

  step("5. Backdate the Budget Change Request's current stage by 50 hours (simulates roughly two days passing)");
  const currentStage = bcr.stages.find((s) => s.status === "current")!;
  await pool.query("UPDATE workflow_stages SET updated_at = now() - interval '50 hours' WHERE id = $1", [currentStage.id]);
  console.log(`  Stage ${currentStage.id} (${currentStage.role}) backdated — expect stalled-stage (warn, ~50h).`);

  // ── Assertions ───────────────────────────────────────────────────────────
  step("Reading the live lifecycle view and checking every signal");
  const view = await api<{
    phase: string;
    canAdvance: boolean;
    checks: { key: string; passed: boolean }[];
    signals: { rule: string; severity: string; detail: string }[];
  }>(`/projects/${projectId}/lifecycle`, t.pm);

  const byRule = (rule: string) => view.signals.filter((s) => s.rule === rule);

  check("cost-variance fired, critical", byRule("cost-variance").some((s) => s.severity === "critical"), byRule("cost-variance"));
  check("cumulative-change-impact fired, warn", byRule("cumulative-change-impact").some((s) => s.severity === "warn"), byRule("cumulative-change-impact"));
  check("burn-vs-progress fired, warn", byRule("burn-vs-progress").some((s) => s.severity === "warn"), byRule("burn-vs-progress"));
  check("issue-recurrence fired, warn, mentions a precedent", byRule("issue-recurrence").some((s) => s.severity === "warn" && /Precedent/i.test(s.detail)), byRule("issue-recurrence"));
  check("stalled-stage fired, warn", byRule("stalled-stage").some((s) => s.severity === "warn"), byRule("stalled-stage"));

  step("Confirming gate checks/canAdvance are identical to what a flag-off server would compute");
  const snapshot = await loadSnapshot(PROJECT_CODE);
  if (!snapshot) throw new Error("Could not load snapshot for independent verification");
  const phase = snapshot.project.status as SequencedPhase;
  const pureChecks = isSequencedPhase(phase) ? evaluateGate(phase, snapshot) : [];
  const nextPhase = isSequencedPhase(phase) ? NEXT_PHASE[phase] : null;
  const advanceEligible = isSequencedPhase(phase) && phase !== "Completed" && phase !== "Archived" && nextPhase != null;
  const pureCanAdvance = advanceEligible && pureChecks.every((c) => c.passed);

  check(
    "checks match exactly (same keys, same passed values)",
    JSON.stringify(view.checks.map((c) => ({ key: c.key, passed: c.passed }))) ===
      JSON.stringify(pureChecks.map((c) => ({ key: c.key, passed: c.passed }))),
    { fromApi: view.checks, pure: pureChecks },
  );
  check("canAdvance matches exactly", view.canAdvance === pureCanAdvance, { fromApi: view.canAdvance, pure: pureCanAdvance });

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log(`\nScenario project ${PROJECT_CODE} (id ${projectId}) left in place for inspection — not cleaned up.`);
  console.log(`Open it in the app at /projects/${projectId} (Project Manager / Consultant / Finance Manager / Engineer) to see DecisionSupportSection with all five signals live.`);
  await pool.end();
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch(async (err) => {
  console.error("\n✘ Scenario failed:", err);
  await pool.end();
  process.exitCode = 1;
});
