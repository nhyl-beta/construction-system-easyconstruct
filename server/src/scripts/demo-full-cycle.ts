// server/src/scripts/demo-full-cycle.ts — NEW (L4/L5)
//
// Walks ONE project through its entire lifecycle — Proposal through
// Archived — via real API calls against a live dev server, exercising
// every phase's gates the same way a human clicking through the UI would.
// This is L4's "walkthrough run against a fresh seed, record actual %" and
// L5's optional full-cycle script in one: run it once against a freshly
// seeded database and it prints the phase-by-phase progress table the
// final report's walkthrough section needs.
//
// Run with: npx tsx src/scripts/demo-full-cycle.ts
// Prerequisite: `npm run dev` running in another terminal, and
// `npm run db:seed` already applied (needs the Project Closeout template
// and the demo accounts/employees it creates).
import "dotenv/config";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8000/api";
const PASSWORD = "Demo@12345";
const PROJECT_CODE = `DEMO-${Date.now().toString(36).toUpperCase()}`;

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

const walkthrough: { phase: string; progress: number }[] = [];

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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json()) as { data?: T; message?: string };
  if (!res.ok) {
    throw new Error(`${opts.method ?? "GET"} ${path} -> ${res.status}: ${json.message ?? JSON.stringify(json)}`);
  }
  return json.data as T;
}

function step(label: string) {
  console.log(`\n▶ ${label}`);
}

// documentId is capped at 20 chars (server/src/validators/document-validators.ts)
// and unique — PROJECT_CODE alone can already be close to that, so document
// IDs get their own short, disposable suffix rather than embedding it.
let docCounter = 0;
function shortDocId(): string {
  docCounter += 1;
  return `DOC-${Date.now().toString(36).slice(-6).toUpperCase()}${docCounter}`;
}

function recordPhase(view: { phase: string; progress: number }) {
  walkthrough.push({ phase: view.phase, progress: view.progress });
  console.log(`  phase=${view.phase} progress=${view.progress}%`);
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

  // Resolve each demo account's numeric user id (needed for project-members).
  const users = await api<{ id: number; name: string; email: string }[]>("/users", t.admin);
  const byEmail = (email: string) => users.find((u) => u.email === email)!.id;
  const ids: Ids = {
    architect: byEmail("architect@easyconstruct.demo"),
    consultant: byEmail("consultant@easyconstruct.demo"),
    engineer: byEmail("engineer@easyconstruct.demo"),
    site: byEmail("site@easyconstruct.demo"),
  };

  step(`Creating project ${PROJECT_CODE}`);
  const project = await api<{ id: number; code: string; pm: string }>("/projects", t.pm, {
    method: "POST",
    body: {
      name: "Demo Full Cycle",
      code: PROJECT_CODE,
      pm: "Miguel Santos",
      due: "2026-12-31",
      client: "Demo Client",
    },
  });
  const projectId = project.id;

  step("Staffing architect, consultant, engineer, site-personnel");
  for (const [role, userIdKey, userName] of [
    ["architect", "architect", "Ana Villanueva"],
    ["consultant", "consultant", "Elena Bautista"],
    ["engineer", "engineer", "Paolo Mendoza"],
    ["site-personnel", "site", "Rico Domingo"],
  ] as const) {
    await api("/project-members", t.pm, {
      method: "POST",
      body: { projectCode: PROJECT_CODE, userId: ids[userIdKey], userName, role },
    });
  }

  const lifecycle = () => api<{ phase: string; progress: number }>(`/projects/${projectId}/lifecycle`, t.pm);
  recordPhase(await lifecycle());

  // ── Proposal ──────────────────────────────────────────────────────────
  step("Proposal: architect submits, consultant + PM approve the workflow");
  const submitted = await api<{ proposal: { id: number }; workflow: { id: number; stages: { id: number; role: string; status: string }[] } }>(
    "/proposals/submit",
    t.architect,
    { method: "POST", body: { proposalId: `PRP-${PROJECT_CODE}`, title: "Demo design proposal", projectCode: PROJECT_CODE, submittedBy: "Ana Villanueva", amount: "500000" } },
  );
  const consultantStage = submitted.workflow.stages.find((s) => s.role === "consultant")!;
  await api(`/workflows/${submitted.workflow.id}/stages/${consultantStage.id}/decision`, t.consultant, {
    method: "PATCH",
    body: { decision: "approve" },
  });
  const afterConsultant = await api<{ stages: { id: number; role: string; status: string }[] }>(
    `/workflows/${submitted.workflow.id}`,
    t.pm,
  );
  const pmStage = afterConsultant.stages.find((s) => s.role === "project-manager")!;
  await api(`/workflows/${submitted.workflow.id}/stages/${pmStage.id}/decision`, t.pm, {
    method: "PATCH",
    body: { decision: "approve" },
  });

  step("Proposal: PM files Notice of Award + Contract, sets contract value");
  for (const type of ["Notice of Award", "Contract"]) {
    await api("/documents", t.pm, {
      method: "POST",
      body: { documentId: shortDocId(), title: type, project: PROJECT_CODE, type, version: "1.0", uploadedBy: "Miguel Santos" },
    });
  }
  await api(`/projects/${projectId}`, t.pm, { method: "PATCH", body: { contractValue: 500000 } });

  step("Advance Proposal → Design");
  recordPhase(await api(`/projects/${projectId}/lifecycle/advance`, t.pm, { method: "POST", body: {} }));

  // ── Design ────────────────────────────────────────────────────────────
  step("Design: create a design with files assigned to the staffed engineer");
  const design = await api<{ id: number }>("/designs", t.architect, {
    method: "POST",
    body: {
      code: `DSN-${PROJECT_CODE}`,
      name: "Demo structural design",
      projectCode: PROJECT_CODE,
      discipline: "Structural",
      category: "Structural",
      leadArchitect: "Ana Villanueva",
      fileUrls: [{ name: "plan.dwg", url: "https://example.com/plan.dwg" }],
      assignedEngineers: [{ userId: ids.engineer, userName: "Paolo Mendoza" }],
    },
  });

  step("Design: consultant approves the design review");
  const review = await api<{ id: number }>("/design-reviews", t.consultant, {
    method: "POST",
    body: { code: `REV-${PROJECT_CODE}`, designId: design.id, requestedBy: "Ana Villanueva" },
  });
  await api(`/design-reviews/${review.id}/decide`, t.consultant, { method: "POST", body: { decision: "Approved" } });

  step("Design: file an approved, current blueprint");
  await api("/blueprints", t.architect, {
    method: "POST",
    body: {
      drawingNumber: `BP-${PROJECT_CODE}`,
      title: "Demo blueprint",
      folder: "Structural",
      author: "Ana Villanueva",
      approval: "Approved",
      status: "Current",
      projectCode: PROJECT_CODE,
      designId: design.id,
    },
  });

  step("Advance Design → Pre-Construction");
  recordPhase(await api(`/projects/${projectId}/lifecycle/advance`, t.pm, { method: "POST", body: {} }));

  // ── Pre-Construction ─────────────────────────────────────────────────
  step("Pre-Construction: Materials + Specifications requirements, approved");
  for (const category of ["Materials", "Specifications"] as const) {
    const req = await api<{ id: number }>("/requirements", t.engineer, {
      method: "POST",
      body: { title: `${category} requirement`, project: PROJECT_CODE, category, description: `Demo ${category.toLowerCase()} requirement for the walkthrough`, createdBy: "Paolo Mendoza" },
    });
    await api(`/requirements/${req.id}`, t.pm, { method: "PATCH", body: { status: "Approved" } });
  }

  step("Pre-Construction: budget, walked through its 4-stage approval");
  const budget = await api<{ id: number }>("/finance/budgets", t.finance, {
    method: "POST",
    body: { project: PROJECT_CODE, category: "Materials", owner: "Carlo Ramos", planned: 100000, fiscalYear: "2026" },
  });
  const APPROVAL_STAGES = ["draft", "pending-review", "finance-review", "manager-review"] as const;
  for (const stage of APPROVAL_STAGES) {
    await api("/finance/budget-approval-steps/decide", t.finance, {
      method: "POST",
      body: { budgetId: budget.id, stage, decision: "approved", actor: "Carlo Ramos" },
    });
  }

  step("Pre-Construction: dated, active milestone");
  const milestone = await api<{ id: number }>("/milestones", t.pm, {
    method: "POST",
    body: { projectCode: PROJECT_CODE, title: "Foundation complete", estimatedCompletionDate: "2026-11-01" },
  });
  await api(`/milestones/${milestone.id}`, t.pm, { method: "PATCH", body: { status: "active" } });

  step("Pre-Construction: task assigned to the staffed site worker, linked to the milestone");
  const task = await api<{ id: number }>("/tasks", t.pm, {
    method: "POST",
    body: { taskCode: `TSK-${PROJECT_CODE}`, projectCode: PROJECT_CODE, title: "Pour foundation", assignedToUserId: ids.site, assignedToName: "Rico Domingo", status: "Pending", progress: 0 },
  });
  await api(`/milestones/${milestone.id}/links`, t.engineer, { method: "POST", body: { linkType: "task", linkId: task.id } });

  step("Pre-Construction: Notice to Proceed + site coordinates");
  await api("/documents", t.pm, {
    method: "POST",
    body: { documentId: shortDocId(), title: "Notice to Proceed", project: PROJECT_CODE, type: "Notice to Proceed", version: "1.0", uploadedBy: "Miguel Santos" },
  });
  await api(`/projects/${projectId}`, t.pm, { method: "PATCH", body: { siteLatitude: 14.5, siteLongitude: 121.0 } });

  step("Advance Pre-Construction → Construction");
  recordPhase(await api(`/projects/${projectId}/lifecycle/advance`, t.pm, { method: "POST", body: {} }));

  // ── Construction ─────────────────────────────────────────────────────
  step("Construction: complete the task, close the milestone, resolve an issue");
  await api(`/tasks/${task.id}/status`, t.site, { method: "PATCH", body: { status: "In Progress" } });
  await api(`/tasks/${task.id}/status`, t.site, { method: "PATCH", body: { status: "Completed", completionNote: "Foundation poured and cured" } });
  await api(`/milestones/${milestone.id}`, t.pm, { method: "PATCH", body: { status: "completed" } });

  const issue = await api<{ id: number }>("/issues", t.engineer, {
    method: "POST",
    body: { issueCode: `ISS-${PROJECT_CODE}`, projectCode: PROJECT_CODE, title: "Minor rebar spacing deviation", description: "Spacing on grid line 4 slightly out of tolerance, corrected on site" },
  });
  await api(`/issues/${issue.id}/status`, t.pm, { method: "PATCH", body: { status: "Resolved", resolutionNotes: "Re-inspected and corrected on site" } });

  step("Advance Construction → Closeout");
  recordPhase(await api(`/projects/${projectId}/lifecycle/advance`, t.pm, { method: "POST", body: {} }));

  // ── Closeout ─────────────────────────────────────────────────────────
  step("Closeout: Final Inspection report, approved");
  const report = await api<{ id: number }>("/engineering-reports", t.engineer, {
    method: "POST",
    body: {
      title: "Final inspection",
      type: "Final Inspection",
      project: PROJECT_CODE,
      location: "Site",
      date: "2026-11-15",
      engineer: "Paolo Mendoza",
      description: "Final walkthrough of completed works",
      findings: "All systems inspected and functioning as designed",
      recommendations: "Approve for closeout",
    },
  });
  await api(`/engineering-reports/${report.id}`, t.pm, { method: "PATCH", body: { status: "Approved" } });

  step("Closeout: Certificate of Completion on file");
  await api("/documents", t.pm, {
    method: "POST",
    body: { documentId: shortDocId(), title: "Certificate of Completion", project: PROJECT_CODE, type: "Certificate of Completion", version: "1.0", uploadedBy: "Miguel Santos" },
  });

  step("Closeout: Project Closeout workflow, walked to completion (no pending expenses)");
  const closeoutTemplates = await api<{ id: number; name: string }[]>("/workflows/templates", t.engineer);
  const closeoutTemplateId = closeoutTemplates.find((tpl) => tpl.name === "Project Closeout")!.id;
  const closeoutWf = await api<{ id: number; stages: { id: number; role: string; status: string }[] }>("/workflows", t.engineer, {
    method: "POST",
    body: { title: `Closeout ${PROJECT_CODE}`, projectCode: PROJECT_CODE, templateId: closeoutTemplateId },
  });
  for (const role of ["finance-manager", "project-manager", "admin"] as const) {
    const stages = await api<{ stages: { id: number; role: string; status: string }[] }>(`/workflows/${closeoutWf.id}`, t.pm);
    const stage = stages.stages.find((s) => s.role === role && s.status === "current")!;
    const actor = role === "finance-manager" ? t.finance : role === "project-manager" ? t.pm : t.admin;
    await api(`/workflows/${closeoutWf.id}/stages/${stage.id}/decision`, actor, { method: "PATCH", body: { decision: "approve" } });
  }

  step("Closeout: payroll batch generated and approved since entering Closeout");
  const payroll = await api<{ batch: { id: string } }>("/payroll/generate", t.hr, {
    method: "POST",
    body: { period: `Closeout ${PROJECT_CODE}`, projectCode: PROJECT_CODE, entries: [{ employeeId: "EMP-DEMO-07", hoursWorked: 8 }] },
  });
  await api(`/finance/payroll-review/${payroll.batch.id}/decide`, t.finance, {
    method: "POST",
    body: { decision: "approved", reviewedBy: "Carlo Ramos" },
  });

  step("Advance Closeout → Completed");
  recordPhase(await api(`/projects/${projectId}/lifecycle/advance`, t.pm, { method: "POST", body: {} }));

  // ── Archive ──────────────────────────────────────────────────────────
  step("Archive (Admin, from Completed)");
  recordPhase(await api(`/projects/${projectId}/lifecycle/archive`, t.admin, { method: "POST", body: {} }));

  console.log("\n=== Walkthrough summary — actual % at each transition ===");
  console.log(`Project: ${PROJECT_CODE} (id ${projectId})`);
  for (const row of walkthrough) {
    console.log(`  ${row.phase.padEnd(16)} ${row.progress}%`);
  }
}

main().catch((err) => {
  console.error("\n✘ Walkthrough failed:", err.message);
  process.exitCode = 1;
});
