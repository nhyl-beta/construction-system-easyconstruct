// server/src/design-requests/service.ts
//
// RFI / RFA workflow. The PM or an Engineer raises a request; the Architect or
// Consultant staffed on the project answers it. An Engineer's request is a
// draft until the PM sends it (the countersign). Open requests block closing a
// project (lifecycle gate X5).
import { SIGNAL_THRESHOLDS } from "../config/signals.js";
import type { DesignRequest } from "../db/schema/design-requests.js";
import { assertProjectWritable } from "../lifecycle/service.js";
import * as notifications from "../notifications/service.js";
import * as projectMemberRepo from "../project-members/repository.js";
import * as projectsRepo from "../projects/repository.js";
import { assertProjectVisible, scopeRowsToVisible } from "../projects/service.js";
import type {
  CreateDesignRequestInput,
  RespondDesignRequestInput,
  UpdateDesignRequestInput,
} from "../validators/design-request-validators.js";
import { logAudit } from "../utils/audit.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../utils/errors.js";
import * as repo from "./repository.js";
import {
  canRaise,
  computeDueDate,
  impliesChangeOrder,
  isEligibleAssigneeRole,
  isOpenRequest,
  isOverdue,
  needsCountersign,
  statusAfterResponse,
  STATUS_LABEL,
  type RequestKind,
  type RequestStatus,
} from "./rules.js";

export interface Actor {
  id: number;
  name: string;
  role: string;
}

const visibility = (a: Actor) => ({ id: a.id, role: a.role, name: a.name });

/** The row plus the derived fields the UI needs; "overdue" is computed here, never stored. */
export const toView = (r: DesignRequest, now: Date = new Date()) => ({
  ...r,
  statusLabel: STATUS_LABEL[r.status as RequestStatus] ?? r.status,
  isOpen: isOpenRequest(r.status),
  isOverdue: isOverdue({ status: r.status, dueDate: r.dueDate }, now),
  suggestsChangeOrder: impliesChangeOrder(r),
});
export type DesignRequestView = ReturnType<typeof toView>;

const requireRequest = async (id: number) => {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError("Request", String(id));
  return row;
};

const assertEligibleAssignee = async (projectCode: string, userId: number) => {
  const memberships = await projectMemberRepo.findAll({ projectCode, userId });
  const m = memberships.find((x) => isEligibleAssigneeRole(x.role));
  if (!m) throw new ValidationError("The request must be assigned to an Architect or Consultant staffed on this project");
  return m;
};

/** People a request on this project can be assigned to. */
export const getAssignees = async (projectCode: string, actor: Actor) => {
  await assertProjectVisible(visibility(actor), projectCode, "requests");
  const members = await projectMemberRepo.findAll({ projectCode });
  return members
    .filter((m) => isEligibleAssigneeRole(m.role))
    .map((m) => ({ userId: m.userId, name: m.userName, role: m.role }));
};

const isPmOrAdmin = (a: Actor) => a.role === "project-manager" || a.role === "admin";

const fileRows = (files: { url: string; filename: string; contentType: string; sizeBytes: number }[] | undefined, stage: "request" | "response", by: string) =>
  (files ?? []).map((f) => ({ ...f, stage, uploadedByName: by }));

const link = (r: { id: number }) => `/requests?open=${r.id}`;

const notifyAssignee = (r: DesignRequest, title: string, body: string) =>
  r.assignedToUserId
    ? notifications.create({ recipientUserId: r.assignedToUserId, projectCode: r.projectCode, title, body, link: link(r) })
    : Promise.resolve();

// ── Reads ──────────────────────────────────────────────────────────────────

export interface ListQuery {
  projectCode?: string;
  kind?: string;
  status?: string;
  search?: string;
  /** "raised": by me; "inbox": assigned to me */
  box?: "raised" | "inbox";
  overdue?: boolean;
}

export const list = async (q: ListQuery, actor: Actor) => {
  const rows = await repo.findAll({
    projectCode: q.projectCode,
    kind: q.kind,
    status: q.status,
    search: q.search,
    requestedByUserId: q.box === "raised" ? actor.id : undefined,
    assignedToUserId: q.box === "inbox" ? actor.id : undefined,
  });
  const visible = await scopeRowsToVisible(visibility(actor), rows, (r) => r.projectCode);
  const now = new Date();
  const views = visible.map((r) => toView(r, now));
  return q.overdue ? views.filter((v) => v.isOverdue) : views;
};

export const getById = async (id: number, actor: Actor) => {
  const row = await requireRequest(id);
  await assertProjectVisible(visibility(actor), row.projectCode, "requests");
  const [files, followUps] = await Promise.all([repo.findFiles([id]), repo.findFollowUps(id)]);
  const origin = row.followUpOfId ? await repo.findById(row.followUpOfId) : null;
  return {
    ...toView(row),
    files,
    followUps: followUps.map((f) => toView(f)),
    followUpOf: origin ? { id: origin.id, number: origin.number } : null,
  };
};

// ── Writes ─────────────────────────────────────────────────────────────────

export const create = async (input: CreateDesignRequestInput, actor: Actor) => {
  if (!canRaise(actor.role)) throw new ForbiddenError("Only the Project Manager or an Engineer can raise an RFI or RFA");
  await assertProjectVisible(visibility(actor), input.projectCode, "requests");
  const project = await projectsRepo.findByCode(input.projectCode);
  if (!project) throw new NotFoundError("Project", input.projectCode);
  await assertProjectWritable(project.code);
  const assignee = await assertEligibleAssignee(project.code, input.assignedToUserId);

  if (input.followUpOfId) {
    const origin = await requireRequest(input.followUpOfId);
    if (origin.projectCode !== project.code) throw new ValidationError("A follow-up must stay on the same project");
    if (origin.status === "closed" || origin.status === "draft") throw new ConflictError("Only an open or answered request can be followed up");
  }

  const now = new Date();
  const sendNow = !needsCountersign(actor.role); // PM / Admin: auto-countersigned and sent
  const created = await repo.insertNumbered(
    { kind: input.kind as RequestKind, projectCode: project.code, discipline: input.discipline, now },
    {
      sheetNumbers: input.sheetNumbers,
      subject: input.subject,
      sectionsReferenced: input.sectionsReferenced,
      requestText: input.requestText,
      costImpact: input.costImpact,
      costNote: input.costNote,
      timeImpact: input.timeImpact,
      timeDays: input.timeDays,
      requestedByUserId: actor.id,
      requestedByName: actor.name,
      requestedByRole: actor.role,
      assignedToUserId: assignee.userId,
      assignedToName: assignee.userName,
      designId: input.designId,
      followUpOfId: input.followUpOfId,
      status: sendNow ? "open" : "draft",
      sentAt: sendNow ? now : null,
      countersignedByUserId: sendNow ? actor.id : null,
      countersignedByName: sendNow ? actor.name : null,
      countersignedAt: sendNow ? now : null,
      dueDate: sendNow ? computeDueDate(input.kind as RequestKind, now, input.dueDays) : null,
    },
    fileRows(input.files, "request", actor.name),
  );
  await logAudit({
    entityType: "design-request",
    entityId: String(created.id),
    action: "created",
    actor: actor.name,
    summary: `${created.number} ${sendNow ? "sent to" : "drafted for"} ${assignee.userName}: ${created.subject}`,
    projectCode: created.projectCode,
  });
  if (sendNow) {
    await notifyAssignee(created, `${created.kind} ${created.number} needs your response`, `${actor.name}: ${created.subject}. Due ${created.dueDate?.toISOString().slice(0, 10)}.`);
  } else {
    await notifications.notifyProject(created.projectCode, ["project-manager"], {
      title: `${created.number} is waiting for you to send`,
      body: `${actor.name} drafted a ${created.kind}: ${created.subject}`,
      link: link(created),
    });
  }
  return toView(created);
};

export const update = async (id: number, input: UpdateDesignRequestInput, actor: Actor) => {
  const row = await requireRequest(id);
  await assertProjectVisible(visibility(actor), row.projectCode, "requests");
  if (row.status !== "draft") throw new ConflictError("Only a draft can be edited; raise a follow-up instead");
  if (row.requestedByUserId !== actor.id && !isPmOrAdmin(actor)) throw new ForbiddenError("Only the person who drafted it, or the PM, can edit a draft");
  let assignee: { userId: number; userName: string } | undefined;
  if (input.assignedToUserId) assignee = await assertEligibleAssignee(row.projectCode, input.assignedToUserId);
  const { files, dueDays: _d, assignedToUserId: _a, ...fields } = input;
  void _d;
  void _a;
  const updated = await repo.update(id, {
    ...fields,
    ...(assignee ? { assignedToUserId: assignee.userId, assignedToName: assignee.userName } : {}),
  });
  if (files) await repo.replaceRequestFiles(id, files.map((f) => ({ ...f, uploadedByName: actor.name })));
  return toView(updated!);
};

/** The PM's "send": countersigns an Engineer's draft and starts the clock. */
export const send = async (id: number, actor: Actor, dueDays?: number) => {
  if (!isPmOrAdmin(actor)) throw new ForbiddenError("Only the Project Manager can send a drafted request");
  const row = await requireRequest(id);
  await assertProjectVisible(visibility(actor), row.projectCode, "requests");
  await assertProjectWritable(row.projectCode);
  if (row.status !== "draft") throw new ConflictError(`Request is ${row.status}, not a draft`);
  const now = new Date();
  const updated = (await repo.update(id, {
    status: "open",
    sentAt: now,
    countersignedByUserId: actor.id,
    countersignedByName: actor.name,
    countersignedAt: now,
    dueDate: computeDueDate(row.kind as RequestKind, now, dueDays),
  }))!;
  await logAudit({ entityType: "design-request", entityId: String(id), action: "sent", actor: actor.name, summary: `${row.number} countersigned and sent to ${row.assignedToName}`, projectCode: row.projectCode });
  await notifyAssignee(updated, `${updated.kind} ${updated.number} needs your response`, `${row.requestedByName} (countersigned by ${actor.name}): ${updated.subject}`);
  return toView(updated);
};

const assertAssigneeOrAdmin = (row: DesignRequest, actor: Actor) => {
  if (actor.role !== "admin" && row.assignedToUserId !== actor.id) {
    throw new ForbiddenError("Only the person this request is assigned to can respond");
  }
};

export const acknowledge = async (id: number, actor: Actor) => {
  const row = await requireRequest(id);
  await assertProjectVisible(visibility(actor), row.projectCode, "requests");
  assertAssigneeOrAdmin(row, actor);
  if (row.status !== "open") throw new ConflictError(`Request is ${row.status}, not open`);
  return toView((await repo.update(id, { status: "in_review" }))!);
};

export const respond = async (id: number, input: RespondDesignRequestInput, actor: Actor) => {
  const row = await requireRequest(id);
  await assertProjectVisible(visibility(actor), row.projectCode, "requests");
  assertAssigneeOrAdmin(row, actor);
  await assertProjectWritable(row.projectCode);
  if (row.status !== "open" && row.status !== "in_review") throw new ConflictError(`Request is ${row.status} and is not awaiting a response`);
  if (row.kind === "RFA" && !input.outcome) throw new ValidationError("Choose an outcome: approved, approved as noted or rejected");
  const status = statusAfterResponse(row.kind as RequestKind, input.outcome);
  const now = new Date();
  const updated = (await repo.update(id, {
    status,
    responseText: input.responseText,
    respondedByUserId: actor.id,
    respondedByName: actor.name,
    respondedAt: now,
  }))!;
  await repo.addFiles(id, fileRows(input.files, "response", actor.name));
  await logAudit({ entityType: "design-request", entityId: String(id), action: "responded", actor: actor.name, summary: `${row.number} ${STATUS_LABEL[status]} by ${actor.name}`, projectCode: row.projectCode });
  const body = `${actor.name}: ${STATUS_LABEL[status]} — ${input.responseText.slice(0, 120)}`;
  const title = `${row.number} was ${row.kind === "RFI" ? "answered" : STATUS_LABEL[status].toLowerCase()}`;
  if (row.requestedByUserId) await notifications.create({ recipientUserId: row.requestedByUserId, projectCode: row.projectCode, title, body, link: link(row) });
  await notifications.notifyProject(row.projectCode, ["project-manager"], { title, body, link: link(row) });
  return toView(updated);
};

export const close = async (id: number, actor: Actor) => {
  const row = await requireRequest(id);
  await assertProjectVisible(visibility(actor), row.projectCode, "requests");
  if (row.requestedByUserId !== actor.id && !isPmOrAdmin(actor)) throw new ForbiddenError("Only the requester or the PM can close a request");
  if (row.status === "closed") throw new ConflictError("Already closed");
  const updated = (await repo.update(id, { status: "closed" }))!;
  await logAudit({ entityType: "design-request", entityId: String(id), action: "closed", actor: actor.name, summary: `${row.number} closed`, projectCode: row.projectCode });
  return toView(updated);
};

export const followUp = async (id: number, input: { requestText: string; dueDays?: number; files?: CreateDesignRequestInput["files"] }, actor: Actor) => {
  const origin = await requireRequest(id);
  if (!origin.assignedToUserId) throw new ValidationError("The original request has no assignee");
  return create(
    {
      kind: origin.kind as RequestKind,
      projectCode: origin.projectCode,
      discipline: origin.discipline as CreateDesignRequestInput["discipline"],
      followUpOfId: origin.id,
      sheetNumbers: origin.sheetNumbers ?? undefined,
      subject: `Follow-up: ${origin.subject}`.slice(0, 255),
      sectionsReferenced: origin.sectionsReferenced ?? undefined,
      requestText: input.requestText,
      costImpact: "none",
      timeImpact: "none",
      assignedToUserId: origin.assignedToUserId,
      dueDays: input.dueDays,
      designId: origin.designId ?? undefined,
      files: input.files,
    },
    actor,
  );
};

/** RFA: the "returned document" block the contractor's staff fill in. */
export const recordReturned = async (id: number, input: { returnedByName: string; returnedByPosition: string; returnedAt?: string }, actor: Actor) => {
  if (!canRaise(actor.role)) throw new ForbiddenError("Only the PM or an Engineer records the returned document");
  const row = await requireRequest(id);
  await assertProjectVisible(visibility(actor), row.projectCode, "requests");
  if (row.kind !== "RFA" || !["approved", "approved_as_noted", "rejected"].includes(row.status)) {
    throw new ConflictError("A returned document is recorded against a decided RFA");
  }
  const at = input.returnedAt ? new Date(input.returnedAt) : new Date();
  if (Number.isNaN(at.getTime())) throw new ValidationError("Invalid returned date");
  return toView((await repo.update(id, { returnedByName: input.returnedByName, returnedByPosition: input.returnedByPosition, returnedAt: at }))!);
};

// ── Deadlines ──────────────────────────────────────────────────────────────

/**
 * Notifies the assignee and the Admin once per request when it becomes overdue.
 * Safe to call repeatedly (and from several instances): `overdue_notified_at`
 * is set in the same step, and the update only wins for the first caller.
 */
export const sweepOverdue = async (now: Date = new Date()): Promise<{ notified: number }> => {
  const due = await repo.findOverdueUnnotified(now);
  let notified = 0;
  for (const r of due) {
    // Claim it first so a concurrent sweep skips it.
    const claimed = await repo.claimOverdueNotification(r.id, now);
    if (!claimed) continue;
    const body = `${r.number} (${r.subject}) was due ${r.dueDate?.toISOString().slice(0, 10)} and has no response yet.`;
    await Promise.all([
      r.assignedToUserId
        ? notifications.create({ recipientUserId: r.assignedToUserId, projectCode: r.projectCode, title: `Overdue: ${r.number}`, body, link: link(r) })
        : Promise.resolve(),
      notifications.create({ recipientRole: "admin", projectCode: r.projectCode, title: `Overdue request ${r.number}`, body: `${body} Assigned to ${r.assignedToName ?? "—"}.`, link: link(r) }),
    ]);
    notified += 1;
  }
  return { notified };
};

/** Admin / Owner "Needs attention": overdue requests, drafts never sent, stalled workflow stages. */
export const getAttention = async (now: Date = new Date()) => {
  const draftCutoff = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const stalledCutoff = new Date(now.getTime() - SIGNAL_THRESHOLDS.stalledStage.warnHours * 60 * 60 * 1000);
  const [overdue, drafts, stalled] = await Promise.all([repo.findOverdue(now), repo.findUnsentDrafts(draftCutoff), repo.findStalledStages(stalledCutoff)]);
  const days = (d: Date | null) => (d ? Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86_400_000)) : 0);
  return {
    overdueRequests: overdue.map((r) => ({ id: r.id, number: r.number, subject: r.subject, projectCode: r.projectCode, assignedToName: r.assignedToName, dueDate: r.dueDate, daysOverdue: days(r.dueDate) })),
    unsentDrafts: drafts.map((r) => ({ id: r.id, number: r.number, subject: r.subject, projectCode: r.projectCode, requestedByName: r.requestedByName, daysWaiting: days(r.createdAt) })),
    stalledStages: stalled.map((s) => ({ stageId: s.stageId, workflowId: s.workflowId, workflowCode: s.workflowCode, title: s.title, projectCode: s.projectCode, roleLabel: s.roleLabel, daysStalled: days(s.updatedAt) })),
    thresholds: { stalledHours: SIGNAL_THRESHOLDS.stalledStage.warnHours, draftDays: 2 },
  };
};

/** Gate input: requests still open on a project. */
export const getOpenForProject = (projectCode: string) => repo.findOpenByProject(projectCode);
