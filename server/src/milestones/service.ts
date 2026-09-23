// server/src/milestones/service.ts — NEW
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import * as notificationsService from "../notifications/service.js";
import { assertProjectWritable, refreshProjectProgress } from "../lifecycle/service.js";
import * as repo from "./repository.js";
import type {
  CreateMilestoneInput,
  CreateMilestoneLinkInput,
  MilestoneStatus,
  UpdateMilestoneInput,
} from "./types.js";

// A milestone's status was only ever visible to whoever had that project's
// detail page open — nothing told the roles who actually act on it that
// anything had changed. Mirrors the notify-on-event pattern already used by
// project-members/service.ts (staffing an architect) and
// budget-approval-steps — role-targeted rows in the same `notifications`
// table, not a new mechanism.
const NOTIFY_ROLES_BY_STATUS: Partial<Record<MilestoneStatus, string[]>> = {
  active: ["engineer"],
  "at-risk": ["owner", "engineer", "admin"],
  completed: ["owner", "admin"],
  cancelled: ["owner"],
};

export const getAll = async (projectCode?: string) => repo.findAll(projectCode);

export const getById = async (id: number) => {
  const milestone = await repo.findById(id);
  if (!milestone) throw new NotFoundError("Milestone", String(id));
  // F4: resolved links — currently only linkType='task' resolves to
  // anything (title/status/assignee); other link types come back bare
  // (linkType/linkId only) until something actually creates one.
  const links = await repo.findLinks(id);
  return { ...milestone, links };
};

/**
 * Every milestone starts as a draft — an estimate the Project Manager is
 * staking out, not a commitment the project is yet being held to. There is
 * no path to create one in any other status; a draft is promoted later
 * through `update()`, a deliberate second step.
 */
export const create = async (input: CreateMilestoneInput, createdBy: string) => {
  await assertProjectWritable(input.projectCode);
  const created = await repo.create({ ...input, createdBy, status: "draft" });
  if (!created) throw new Error("Failed to create milestone");
  await refreshProjectProgress(created.projectCode);
  return created;
};

export const update = async (id: number, input: UpdateMilestoneInput) => {
  const existing = await getById(id);
  await assertProjectWritable(existing.projectCode);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("Milestone", String(id));

  if (input.status && input.status !== existing.status) {
    const recipients = NOTIFY_ROLES_BY_STATUS[input.status] ?? [];
    await Promise.all(
      recipients.map((recipientRole) =>
        notificationsService.create({
          recipientRole,
          title: `Milestone ${input.status}`,
          body: `"${updated.title}" on project ${updated.projectCode} is now ${input.status}.`,
          link: `/projects/${encodeURIComponent(updated.projectCode)}`,
        }),
      ),
    );
  }

  await refreshProjectProgress(updated.projectCode);
  return updated;
};

export const remove = async (id: number) => {
  const existing = await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Milestone", String(id));
  await refreshProjectProgress(existing.projectCode);
  return existing;
};

// ── Links (F4) ───────────────────────────────────────────────────────────
//
// Route-level guard (milestones/routes.ts) is "PM/admin/it-designer, plus
// engineer for linkType='task'" — the engineer half can't be expressed as a
// single requireRole() since it depends on the request BODY, not just the
// role, so it's enforced here instead.
const assertCanLink = (requesterRole: string, linkType: string) => {
  if (["project-manager", "admin", "it-designer"].includes(requesterRole)) return;
  if (requesterRole === "engineer" && linkType === "task") return;
  throw new ForbiddenError(
    `Role '${requesterRole}' cannot link a '${linkType}' to a milestone`,
  );
};

export const createLink = async (
  milestoneId: number,
  input: CreateMilestoneLinkInput,
  requesterRole: string,
) => {
  assertCanLink(requesterRole, input.linkType);
  const milestone = await getById(milestoneId);
  await assertProjectWritable(milestone.projectCode);
  const created = await repo.createLink(milestoneId, input);
  if (!created) throw new Error("Failed to create milestone link");
  await refreshProjectProgress(milestone.projectCode);
  return getById(milestoneId);
};

export const removeLink = async (milestoneId: number, linkId: number, requesterRole: string) => {
  const link = await repo.findLinkById(linkId);
  if (!link || link.milestoneId !== milestoneId) {
    throw new NotFoundError("Milestone link", String(linkId));
  }
  assertCanLink(requesterRole, link.linkType);
  const milestone = await getById(milestoneId);
  await assertProjectWritable(milestone.projectCode);
  const deleted = await repo.removeLink(linkId);
  if (!deleted) throw new NotFoundError("Milestone link", String(linkId));
  await refreshProjectProgress(milestone.projectCode);
  return getById(milestoneId);
};
