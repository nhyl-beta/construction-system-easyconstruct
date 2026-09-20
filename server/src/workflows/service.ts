import { ForbiddenError, NotFoundError, ValidationError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type {
  ApprovalQueueItem,
  ApprovalScope,
  CreateWorkflowInput,
  DecideStageInput,
  TemplateWithActiveCount,
  UpdateWorkflowInput,
  WorkflowAttachmentInput,
  WorkflowAttachmentRecord,
  WorkflowLineItemRecord,
  WorkflowWithStages,
} from "./types.js";

// Same ownership rule used for project-engineers (EC-017): admin/it-designer
// may manage any workflow; anyone else only the one they created.
const assertCanManageWorkflow = async (id: number, requesterRole: string, requesterName: string) => {
  if (PRIVILEGED_ROLES.includes(requesterRole)) return;
  const workflow = await repo.findWorkflowById(id);
  if (!workflow) throw new NotFoundError("Workflow", String(id));
  if (workflow.createdBy !== requesterName) {
    throw new ForbiddenError("You can only edit or delete workflows you created");
  }
};

// ── Templates ──────────────────────────────────────────────────────────────

export const getTemplates = async (): Promise<TemplateWithActiveCount[]> => {
  const [templates, activeCounts] = await Promise.all([
    repo.findAllTemplates(),
    repo.countActiveByTemplate(),
  ]);

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    avgDurationHours: t.avgDurationHours,
    defaultStages: t.defaultStages,
    activeCount: activeCounts.get(t.id) ?? 0,
  }));
};

// ── Workflows ──────────────────────────────────────────────────────────────

const attachStages = async (rows: (typeof import("../db/schema/workflows.js").workflows.$inferSelect)[]) => {
  const ids = rows.map((r) => r.id);
  // Attachments and line items are fetched with the stages, not on a separate
  // round trip per screen: every approval view needs the full submission
  // trail, so a workflow that arrives without it is what left approvers
  // deciding blind in the first place.
  const [stages, templates, attachmentRows, lineItemRows] = await Promise.all([
    repo.findStagesForWorkflows(ids),
    repo.findAllTemplates(),
    repo.findAttachmentsForWorkflows(ids),
    repo.findLineItemsForWorkflows(ids),
  ]);
  const templateNameById = new Map(templates.map((t) => [t.id, t.name]));

  const stagesByWorkflow = new Map<number, typeof stages>();
  for (const s of stages) {
    const list = stagesByWorkflow.get(s.workflowId) ?? [];
    list.push(s);
    stagesByWorkflow.set(s.workflowId, list);
  }

  const attachmentsByWorkflow = new Map<number, WorkflowAttachmentRecord[]>();
  for (const { attachment, stageLabel } of attachmentRows) {
    const list = attachmentsByWorkflow.get(attachment.workflowId) ?? [];
    list.push({ ...attachment, stageLabel: stageLabel ?? null });
    attachmentsByWorkflow.set(attachment.workflowId, list);
  }

  const lineItemsByWorkflow = new Map<number, WorkflowLineItemRecord[]>();
  for (const item of lineItemRows) {
    const list = lineItemsByWorkflow.get(item.workflowId) ?? [];
    list.push(item);
    lineItemsByWorkflow.set(item.workflowId, list);
  }

  return rows.map((w): WorkflowWithStages => ({
    id: w.id,
    code: w.code,
    title: w.title,
    projectCode: w.projectCode,
    templateId: w.templateId,
    templateName: w.templateId ? templateNameById.get(w.templateId) ?? null : null,
    amount: w.amount,
    type: w.type,
    severity: w.severity,
    aiNote: w.aiNote,
    status: w.status,
    createdBy: w.createdBy,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    stages: (stagesByWorkflow.get(w.id) ?? []).map((s) => ({
      id: s.id,
      sequence: s.sequence,
      role: s.role,
      roleLabel: s.roleLabel,
      iconKey: s.iconKey,
      status: s.status,
      assignedTo: s.assignedTo,
      decidedBy: s.decidedBy,
      decidedAt: s.decidedAt,
      comments: s.comments,
      createdAt: s.createdAt,
    })),
    attachments: attachmentsByWorkflow.get(w.id) ?? [],
    lineItems: lineItemsByWorkflow.get(w.id) ?? [],
  }));
};

export const getActiveWorkflows = async (): Promise<WorkflowWithStages[]> => {
  const rows = await repo.findWorkflows("active");
  return attachStages(rows);
};

export const getWorkflowById = async (id: number): Promise<WorkflowWithStages> => {
  const row = await repo.findWorkflowById(id);
  if (!row) throw new NotFoundError("Workflow", String(id));
  const attached = await attachStages([row]);
  const withStages = attached[0];
  if (!withStages) throw new NotFoundError("Workflow", String(id));
  return withStages;
};

export const updateWorkflow = async (
  id: number,
  input: UpdateWorkflowInput,
  requesterRole: string,
  requesterName: string,
): Promise<WorkflowWithStages> => {
  await assertCanManageWorkflow(id, requesterRole, requesterName);
  const updated = await repo.updateWorkflow(id, input);
  if (!updated) throw new NotFoundError("Workflow", String(id));
  return getWorkflowById(id);
};

export const deleteWorkflow = async (
  id: number,
  requesterRole: string,
  requesterName: string,
): Promise<WorkflowWithStages> => {
  await assertCanManageWorkflow(id, requesterRole, requesterName);
  // Fetch the full record (with stages) before the row — and its
  // cascade-deleted stages — disappear, so the caller/audit log still has
  // something to show for what was removed.
  const existing = await getWorkflowById(id);
  const deleted = await repo.deleteWorkflow(id);
  if (!deleted) throw new NotFoundError("Workflow", String(id));
  return existing;
};

export const createWorkflow = async (
  input: CreateWorkflowInput,
  createdBy: string,
): Promise<WorkflowWithStages> => {
  const template = await repo.findTemplateById(input.templateId);
  if (!template) throw new ValidationError(`Unknown workflow template ${input.templateId}`);

  const seq = await repo.nextWorkflowSeq();
  const code = `WF-${1000 + seq}`;

  const workflow = await repo.insertWorkflow({
    code,
    title: input.title,
    projectCode: input.projectCode,
    templateId: template.id,
    amount: input.amount !== undefined ? String(input.amount) : null,
    type: input.type ?? null,
    severity: "medium",
    aiNote: null,
    status: "active",
    createdBy,
  });
  if (!workflow) throw new Error("Failed to create workflow");

  const stageRows = template.defaultStages.map((def, index) => ({
    workflowId: workflow.id,
    sequence: index + 1,
    role: def.role,
    roleLabel: def.roleLabel,
    iconKey: def.iconKey,
    status: index === 0 ? "current" : "upcoming",
    assignedTo: input.stageAssignments?.[String(index + 1)] ?? null,
  }));
  const insertedStages = await repo.insertStages(stageRows);

  // Whatever the initiator submitted is filed against stage 1 — their own
  // step — so later approvers can see which point in the chain it came from.
  const firstStage = insertedStages.find((stage) => stage.sequence === 1) ?? null;

  if (input.attachments?.length) {
    await repo.insertAttachments(
      input.attachments.map((a) => toAttachmentRow(a, workflow.id, firstStage?.id ?? null, createdBy)),
    );
  }

  if (input.lineItems?.length) {
    await repo.insertLineItems(
      input.lineItems.map((item) => ({
        workflowId: workflow.id,
        category: item.category,
        description: item.description,
        currentAmount: (item.currentAmount ?? 0).toFixed(2),
        requestedAmount: item.requestedAmount.toFixed(2),
      })),
    );
  }

  return getWorkflowById(workflow.id);
};

// ── Attachments ────────────────────────────────────────────────────────────

const toAttachmentRow = (
  input: WorkflowAttachmentInput,
  workflowId: number,
  stageId: number | null,
  uploadedBy: string,
) => ({
  workflowId,
  stageId: input.stageId ?? stageId,
  kind: input.kind ?? (input.fileUrl ? "document" : "note"),
  label: input.label,
  content: input.content ?? null,
  fileUrl: input.fileUrl ?? null,
  fileName: input.fileName ?? null,
  fileSize: input.fileSize ?? null,
  uploadedBy,
});

/**
 * File something against a workflow that is already running — e.g. a
 * consultant attaching an advisory note, or a stage owner adding the document
 * their decision rests on. Defaults to the workflow's current stage so the
 * caller does not have to know the stage id.
 */
export const addAttachment = async (
  workflowId: number,
  input: WorkflowAttachmentInput,
  uploadedBy: string,
): Promise<WorkflowWithStages> => {
  const workflow = await repo.findWorkflowById(workflowId);
  if (!workflow) throw new NotFoundError("Workflow", String(workflowId));

  const stages = await repo.findStagesByWorkflow(workflowId);
  const currentStage = stages.find((stage) => stage.status === "current") ?? null;

  await repo.insertAttachments([
    toAttachmentRow(input, workflowId, currentStage?.id ?? null, uploadedBy),
  ]);

  return getWorkflowById(workflowId);
};

/**
 * Every workflow raised from a named template, with its stages, attachments
 * and line items already attached. Finance's budget-change review is the
 * first caller (template "Budget Change Request"); the lookup is by name
 * rather than a hardcoded id because template ids differ per environment.
 */
export const getWorkflowsByTemplateName = async (
  templateName: string,
): Promise<WorkflowWithStages[]> => {
  const template = await repo.findTemplateByName(templateName);
  if (!template) return [];
  const rows = await repo.findWorkflowsByTemplate(template.id);
  return attachStages(rows);
};

// ── Decisions ──────────────────────────────────────────────────────────────

export const decideStage = async (
  workflowId: number,
  stageId: number,
  input: DecideStageInput,
  requesterRole: string,
): Promise<WorkflowWithStages> => {
  const stage = await repo.findStageById(stageId);
  if (!stage || stage.workflowId !== workflowId) {
    throw new NotFoundError("Workflow stage", String(stageId));
  }
  if (stage.status !== "current") {
    throw new ValidationError(
      `Stage ${stageId} is '${stage.status}' and is not awaiting a decision`,
    );
  }
  // Intentional (EC-003, decided): admin/it-designer can decide ANY stage
  // regardless of its assigned role. This is a deliberate escalation/
  // override path (e.g. a role-holder is unavailable) — do not remove or
  // restrict this without a product decision to do so.
  const isPrivileged = requesterRole === "admin" || requesterRole === "it-designer";
  if (!isPrivileged && stage.role !== requesterRole) {
    throw new ForbiddenError(
      `This stage requires a '${stage.role}' decision; you are '${requesterRole}'`,
    );
  }

  const decidedAt = new Date();
  const nextStageStatus =
    input.decision === "approve" ? "done" : input.decision === "reject" ? "rejected" : "revision-required";

  await repo.updateStage(stageId, {
    status: nextStageStatus,
    decidedBy: input.decidedBy,
    decidedAt,
    comments: input.comments ?? null,
  });

  if (input.decision === "reject") {
    await repo.updateWorkflowStatus(workflowId, "rejected");
  } else if (input.decision === "approve") {
    const allStages = await repo.findStagesByWorkflow(workflowId);
    const next = allStages.find((s) => s.sequence === stage.sequence + 1);
    if (next) {
      await repo.updateStage(next.id, { status: "current" });
    } else {
      await repo.updateWorkflowStatus(workflowId, "completed");
    }
  }
  // "revise" leaves the workflow status as-is and the stage in
  // "revision-required" — resubmission (setting it back to "current") is a
  // deliberate follow-up action, not automatic.

  return getWorkflowById(workflowId);
};

// ── Approval queue ─────────────────────────────────────────────────────────

const ageLabel = (from: Date | null): string => {
  if (!from) return "—";
  const hours = (Date.now() - from.getTime()) / (1000 * 60 * 60);
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
};

const PRIVILEGED_ROLES = ["admin", "it-designer"];

export const getApprovalQueue = async (
  scope: ApprovalScope,
  requesterRole: string,
  requesterName: string,
): Promise<ApprovalQueueItem[]> => {
  const rows =
    scope === "pending"
      ? await repo.findPendingStagesForRole(requesterRole, PRIVILEGED_ROLES.includes(requesterRole))
      : scope === "mine"
        ? await repo.findDecidedStagesBy(requesterName)
        : await repo.findAllDecidedStages();

  // A queue row that does not say whether anything was submitted gives the
  // approver no reason to open the detail view at all.
  const workflowIds = [...new Set(rows.map((r) => r.workflow.id))];
  const [attachmentRows, lineItemRows] = await Promise.all([
    repo.findAttachmentsForWorkflows(workflowIds),
    repo.findLineItemsForWorkflows(workflowIds),
  ]);
  const attachmentCounts = new Map<number, number>();
  for (const { attachment } of attachmentRows) {
    attachmentCounts.set(
      attachment.workflowId,
      (attachmentCounts.get(attachment.workflowId) ?? 0) + 1,
    );
  }
  const lineItemCounts = new Map<number, number>();
  for (const item of lineItemRows) {
    lineItemCounts.set(item.workflowId, (lineItemCounts.get(item.workflowId) ?? 0) + 1);
  }

  return rows.map(({ stage, workflow }) => ({
    stageId: stage.id,
    workflowId: workflow.id,
    workflowCode: workflow.code,
    title: workflow.title,
    projectCode: workflow.projectCode,
    type: workflow.type,
    amount: workflow.amount,
    severity: workflow.severity,
    aiNote: workflow.aiNote,
    ownerRoleLabel: stage.roleLabel,
    status: stage.status,
    assignedTo: stage.assignedTo,
    decidedBy: stage.decidedBy,
    decidedAt: stage.decidedAt,
    createdAt: stage.createdAt,
    attachmentCount: attachmentCounts.get(workflow.id) ?? 0,
    lineItemCount: lineItemCounts.get(workflow.id) ?? 0,
  }));
};

export const getApprovalStats = async (requesterRole: string, requesterName: string) => {
  const pending = await getApprovalQueue("pending", requesterRole, requesterName);
  const history = await getApprovalQueue("history", requesterRole, requesterName);

  const overdue = pending.filter((p) => {
    if (!p.createdAt) return false;
    return Date.now() - p.createdAt.getTime() > 48 * 60 * 60 * 1000;
  }).length;

  const decidedWithDuration = history.filter((h) => h.createdAt && h.decidedAt);
  const avgCycleDays =
    decidedWithDuration.length === 0
      ? 0
      : decidedWithDuration.reduce((sum, h) => {
          const ms = h.decidedAt!.getTime() - h.createdAt!.getTime();
          return sum + ms / (1000 * 60 * 60 * 24);
        }, 0) / decidedWithDuration.length;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = history.filter((h) => h.decidedAt && h.decidedAt.getTime() >= weekAgo).length;

  return {
    pending: pending.length,
    overdue,
    avgCycleDays: Number(avgCycleDays.toFixed(1)),
    thisWeek,
  };
};

export { ageLabel };