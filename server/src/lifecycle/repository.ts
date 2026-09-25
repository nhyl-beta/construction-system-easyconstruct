// server/src/lifecycle/repository.ts — NEW
//
// Loads everything the gate checks (gates.ts) need for one project in a
// handful of queries, scoped entirely by project code. Deliberately
// self-contained rather than reusing each domain's own repository.findAll —
// those have inconsistent filter shapes (project vs projectCode vs code) and
// pulling from all of them here would coincidentally tie gates.ts to
// whichever filter option each one happens to support. The snapshot is a
// plain object, so gates.ts's checks stay pure functions, testable with no
// database at all (see lifecycle/gates.test.ts).
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../db/connection.js";
import { projects } from "../db/schema/projects.js";
import { projectMembers } from "../db/schema/project-members.js";
import { proposals } from "../db/schema/proposals.js";
import { workflows, workflowStages } from "../db/schema/workflows.js";
import { documents } from "../db/schema/documents.js";
import { designs } from "../db/schema/designs.js";
import { designReviews } from "../db/schema/design-reviews.js";
import { blueprints } from "../db/schema/blueprints.js";
import { requirements } from "../db/schema/requirements.js";
import { budgets } from "../db/schema/finance.js";
import { milestones, milestoneLinks } from "../db/schema/milestones.js";
import { employees } from "../db/schema/employees.js";
import { tasks } from "../db/schema/task.js";
import { issues } from "../db/schema/issues.js";
import { engineeringReports } from "../db/schema/engineering-reports.js";
import { payrollBatches } from "../db/schema/finance.js";
import { projectPhaseHistory } from "../db/schema/project-phase-history.js";
import { workflowTemplates } from "../db/schema/workflows.js";
import { validationResults } from "../db/schema/ai-validation.js";

// Gate X4 needs to know which workflows were raised from the "Project
// Closeout" template (H3) without gates.ts — a pure-function module — ever
// touching the database itself, so the id is resolved once here and carried
// on the snapshot instead.
export const CLOSEOUT_TEMPLATE_NAME = "Project Closeout";

export type LifecycleSnapshot = NonNullable<Awaited<ReturnType<typeof loadSnapshot>>>;

export const loadSnapshot = async (projectCode: string) => {
  const [project] = await db.select().from(projects).where(eq(projects.code, projectCode));
  if (!project) return null;

  const [
    members,
    projectProposals,
    projectDocuments,
    projectDesigns,
    projectBlueprints,
    projectRequirements,
    projectBudgets,
    projectMilestones,
    projectTasks,
    projectIssues,
    projectEngineeringReports,
    projectPayrollBatches,
    projectWorkflows,
    phaseHistory,
  ] = await Promise.all([
    db.select().from(projectMembers).where(eq(projectMembers.projectCode, projectCode)),
    db.select().from(proposals).where(eq(proposals.projectCode, projectCode)),
    db.select().from(documents).where(eq(documents.project, projectCode)),
    db.select().from(designs).where(eq(designs.projectCode, projectCode)),
    db.select().from(blueprints).where(eq(blueprints.projectCode, projectCode)),
    db.select().from(requirements).where(eq(requirements.project, projectCode)),
    db.select().from(budgets).where(eq(budgets.project, projectCode)),
    db.select().from(milestones).where(eq(milestones.projectCode, projectCode)),
    db.select().from(tasks).where(eq(tasks.projectCode, projectCode)),
    db.select().from(issues).where(eq(issues.projectCode, projectCode)),
    db.select().from(engineeringReports).where(eq(engineeringReports.project, projectCode)),
    db.select().from(payrollBatches).where(eq(payrollBatches.projectCode, projectCode)),
    db.select().from(workflows).where(eq(workflows.projectCode, projectCode)),
    db
      .select()
      .from(projectPhaseHistory)
      .where(eq(projectPhaseHistory.projectCode, projectCode)),
  ]);

  const designIds = projectDesigns.map((d) => d.id);
  const projectDesignReviews = designIds.length
    ? await db.select().from(designReviews).where(inArray(designReviews.designId, designIds))
    : [];

  const milestoneIds = projectMilestones.map((m) => m.id);
  const projectMilestoneLinks = milestoneIds.length
    ? await db.select().from(milestoneLinks).where(inArray(milestoneLinks.milestoneId, milestoneIds))
    : [];

  const workflowIds = projectWorkflows.map((w) => w.id);
  const projectWorkflowStages = workflowIds.length
    ? await db.select().from(workflowStages).where(inArray(workflowStages.workflowId, workflowIds))
    : [];

  // Referenced workflows for proposals not raised against THIS project's own
  // workflows list can't happen (a proposal's workflow always shares its
  // project code), but proposals are looked up by workflowId, so resolve
  // those ids against `projectWorkflows` directly rather than a second query.
  const proposalWorkflowIds = projectProposals
    .map((p) => p.workflowId)
    .filter((id): id is number => id != null);
  const proposalWorkflows =
    proposalWorkflowIds.length > 0
      ? projectWorkflows.filter((w) => proposalWorkflowIds.includes(w.id))
      : [];

  const staffedUserIds = members.map((m) => m.userId);
  const staffedEmployees = staffedUserIds.length
    ? await db.select().from(employees).where(inArray(employees.userId, staffedUserIds))
    : [];

  const [closeoutTemplate] = await db
    .select()
    .from(workflowTemplates)
    .where(eq(workflowTemplates.name, CLOSEOUT_TEMPLATE_NAME));

  // ai-signals D2: decision-support-only fields, read by signals/*.ts, never
  // by gates.ts. validationResults is scoped to this project (the column
  // already carries it); issuePrecedents deliberately is NOT — it draws on
  // resolved issues from every project, but exposes only the fields safe to
  // show across a project boundary (never another project's commercial data).
  const projectValidationResults = await db
    .select()
    .from(validationResults)
    .where(eq(validationResults.projectCode, projectCode));

  const openIssueCategories = Array.from(
    new Set(
      projectIssues
        .filter((i) => i.status === "Submitted" || i.status === "Under Review")
        .map((i) => i.category),
    ),
  );
  let issuePrecedents: {
    issueCode: string;
    title: string;
    category: string;
    resolutionNotes: string;
    updatedAt: Date | null;
  }[] = [];
  if (openIssueCategories.length > 0) {
    const resolvedWithNotes = await db
      .select({
        issueCode: issues.issueCode,
        title: issues.title,
        category: issues.category,
        resolutionNotes: issues.resolutionNotes,
        updatedAt: issues.updatedAt,
      })
      .from(issues)
      .where(
        and(
          eq(issues.status, "Resolved"),
          inArray(issues.category, openIssueCategories),
          isNotNull(issues.resolutionNotes),
        ),
      )
      .orderBy(desc(issues.updatedAt));

    const byCategory = new Map<string, typeof issuePrecedents>();
    for (const row of resolvedWithNotes) {
      if (!row.resolutionNotes || row.resolutionNotes.trim() === "") continue;
      const list = byCategory.get(row.category) ?? [];
      if (list.length < 3) {
        list.push({ ...row, resolutionNotes: row.resolutionNotes });
        byCategory.set(row.category, list);
      }
    }
    issuePrecedents = Array.from(byCategory.values()).flat();
  }

  return {
    project,
    members,
    proposals: projectProposals,
    proposalWorkflows,
    documents: projectDocuments,
    designs: projectDesigns,
    designReviews: projectDesignReviews,
    blueprints: projectBlueprints,
    requirements: projectRequirements,
    budgets: projectBudgets,
    milestones: projectMilestones,
    milestoneLinks: projectMilestoneLinks,
    tasks: projectTasks,
    issues: projectIssues,
    engineeringReports: projectEngineeringReports,
    payrollBatches: projectPayrollBatches,
    workflows: projectWorkflows,
    workflowStages: projectWorkflowStages,
    phaseHistory,
    staffedEmployees,
    closeoutTemplateId: closeoutTemplate?.id ?? null,
    validationResults: projectValidationResults,
    issuePrecedents,
  };
};

export const insertPhaseHistory = async (row: {
  projectCode: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedByUserId: number | null;
  reason?: string | null;
  override?: boolean;
  gateSnapshot?: unknown;
}) => {
  const [created] = await db
    .insert(projectPhaseHistory)
    .values({
      projectCode: row.projectCode,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      changedBy: row.changedBy,
      changedByUserId: row.changedByUserId,
      reason: row.reason ?? null,
      override: row.override ?? false,
      gateSnapshot: row.gateSnapshot ?? null,
    })
    .returning();
  return created;
};

export const findPhaseHistory = async (projectCode: string) =>
  db
    .select()
    .from(projectPhaseHistory)
    .where(eq(projectPhaseHistory.projectCode, projectCode))
    .orderBy(projectPhaseHistory.createdAt);
