import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import {
  workflowAttachments,
  workflowLineItems,
  workflowStages,
  workflowTemplates,
  workflows,
} from "../db/schema/workflows.js";

// ── Templates ──────────────────────────────────────────────────────────────

export const findAllTemplates = async () => {
  return db.select().from(workflowTemplates).orderBy(workflowTemplates.id);
};

export const findTemplateById = async (id: number) => {
  const [row] = await db
    .select()
    .from(workflowTemplates)
    .where(eq(workflowTemplates.id, id));
  return row ?? null;
};

export const countActiveByTemplate = async (): Promise<Map<number, number>> => {
  const rows = await db
    .select({
      templateId: workflows.templateId,
      count: sql<number>`count(*)::int`,
    })
    .from(workflows)
    .where(eq(workflows.status, "active"))
    .groupBy(workflows.templateId);

  const map = new Map<number, number>();
  for (const row of rows) {
    if (row.templateId !== null) map.set(row.templateId, row.count);
  }
  return map;
};

// ── Workflows ──────────────────────────────────────────────────────────────

export const findWorkflows = async (status?: string) => {
  const query = db.select().from(workflows).orderBy(desc(workflows.createdAt));
  return status ? query.where(eq(workflows.status, status)) : query;
};

export const findWorkflowById = async (id: number) => {
  const [row] = await db.select().from(workflows).where(eq(workflows.id, id));
  return row ?? null;
};

export const findStagesForWorkflows = async (workflowIds: number[]) => {
  if (workflowIds.length === 0) return [];
  return db
    .select()
    .from(workflowStages)
    .where(inArray(workflowStages.workflowId, workflowIds))
    .orderBy(workflowStages.workflowId, workflowStages.sequence);
};

export const nextWorkflowSeq = async (): Promise<number> => {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${workflows.id}), 0)` })
    .from(workflows);
  return (row?.max ?? 0) + 1;
};

export const insertWorkflow = async (data: typeof workflows.$inferInsert) => {
  const [created] = await db.insert(workflows).values(data).returning();
  return created;
};

export const insertStages = async (rows: (typeof workflowStages.$inferInsert)[]) => {
  if (rows.length === 0) return [];
  return db.insert(workflowStages).values(rows).returning();
};

export const updateWorkflowStatus = async (id: number, status: string) => {
  const [updated] = await db
    .update(workflows)
    .set({ status, updatedAt: new Date() })
    .where(eq(workflows.id, id))
    .returning();
  return updated ?? null;
};

export const updateWorkflow = async (id: number, data: Partial<typeof workflows.$inferInsert>) => {
  const [updated] = await db
    .update(workflows)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workflows.id, id))
    .returning();
  return updated ?? null;
};

// workflow_stages.workflow_id has onDelete: "cascade" — deleting the
// workflow row cascades the stage rows automatically.
export const deleteWorkflow = async (id: number) => {
  const [deleted] = await db.delete(workflows).where(eq(workflows.id, id)).returning();
  return deleted ?? null;
};

// ── Stages ─────────────────────────────────────────────────────────────────

export const findStageById = async (id: number) => {
  const [row] = await db.select().from(workflowStages).where(eq(workflowStages.id, id));
  return row ?? null;
};

export const findStagesByWorkflow = async (workflowId: number) => {
  return db
    .select()
    .from(workflowStages)
    .where(eq(workflowStages.workflowId, workflowId))
    .orderBy(workflowStages.sequence);
};

export const updateStage = async (
  id: number,
  data: Partial<typeof workflowStages.$inferInsert>,
) => {
  const [updated] = await db
    .update(workflowStages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workflowStages.id, id))
    .returning();
  return updated ?? null;
};

// ── Approval queue views ─────────────────────────────────────────────────────

export const findPendingStagesForRole = async (role: string, isPrivileged: boolean) => {
  const condition = isPrivileged
    ? eq(workflowStages.status, "current")
    : and(eq(workflowStages.status, "current"), eq(workflowStages.role, role));

  return db
    .select({ stage: workflowStages, workflow: workflows })
    .from(workflowStages)
    .innerJoin(workflows, eq(workflowStages.workflowId, workflows.id))
    .where(condition)
    .orderBy(workflowStages.createdAt);
};

export const findDecidedStagesBy = async (decidedBy: string) => {
  return db
    .select({ stage: workflowStages, workflow: workflows })
    .from(workflowStages)
    .innerJoin(workflows, eq(workflowStages.workflowId, workflows.id))
    .where(eq(workflowStages.decidedBy, decidedBy))
    .orderBy(desc(workflowStages.decidedAt));
};

export const findAllDecidedStages = async () => {
  return db
    .select({ stage: workflowStages, workflow: workflows })
    .from(workflowStages)
    .innerJoin(workflows, eq(workflowStages.workflowId, workflows.id))
    .where(inArray(workflowStages.status, ["done", "rejected"]))
    .orderBy(desc(workflowStages.decidedAt));
};
// ── Attachments ────────────────────────────────────────────────────────────

export const findAttachmentsForWorkflows = async (workflowIds: number[]) => {
  if (workflowIds.length === 0) return [];
  // Left join so an attachment filed before its stage was known (or whose
  // stage row has since gone) still comes back, just without a stage label.
  return db
    .select({
      attachment: workflowAttachments,
      stageLabel: workflowStages.roleLabel,
    })
    .from(workflowAttachments)
    .leftJoin(workflowStages, eq(workflowAttachments.stageId, workflowStages.id))
    .where(inArray(workflowAttachments.workflowId, workflowIds))
    .orderBy(workflowAttachments.createdAt);
};

export const insertAttachments = async (
  rows: (typeof workflowAttachments.$inferInsert)[],
) => {
  if (rows.length === 0) return [];
  return db.insert(workflowAttachments).values(rows).returning();
};

// ── Line items ─────────────────────────────────────────────────────────────

export const findLineItemsForWorkflows = async (workflowIds: number[]) => {
  if (workflowIds.length === 0) return [];
  return db
    .select()
    .from(workflowLineItems)
    .where(inArray(workflowLineItems.workflowId, workflowIds))
    .orderBy(workflowLineItems.id);
};

export const insertLineItems = async (
  rows: (typeof workflowLineItems.$inferInsert)[],
) => {
  if (rows.length === 0) return [];
  return db.insert(workflowLineItems).values(rows).returning();
};

// ── Workflows by template ──────────────────────────────────────────────────

// Finance's budget-change review lists every request raised from the
// Budget Change Request template, regardless of which stage it is sitting on.
export const findWorkflowsByTemplate = async (templateId: number) => {
  return db
    .select()
    .from(workflows)
    .where(eq(workflows.templateId, templateId))
    .orderBy(desc(workflows.createdAt));
};

export const findTemplateByName = async (name: string) => {
  const [row] = await db
    .select()
    .from(workflowTemplates)
    .where(sql`lower(${workflowTemplates.name}) = lower(${name})`);
  return row ?? null;
};
