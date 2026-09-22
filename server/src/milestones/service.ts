// server/src/milestones/service.ts — NEW
import { NotFoundError } from "../utils/errors.js";
import * as notificationsService from "../notifications/service.js";
import * as repo from "./repository.js";
import type { CreateMilestoneInput, MilestoneStatus, UpdateMilestoneInput } from "./types.js";

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
  return milestone;
};

/**
 * Every milestone starts as a draft — an estimate the Project Manager is
 * staking out, not a commitment the project is yet being held to. There is
 * no path to create one in any other status; a draft is promoted later
 * through `update()`, a deliberate second step.
 */
export const create = async (input: CreateMilestoneInput, createdBy: string) => {
  const created = await repo.create({ ...input, createdBy, status: "draft" });
  if (!created) throw new Error("Failed to create milestone");
  return created;
};

export const update = async (id: number, input: UpdateMilestoneInput) => {
  const existing = await getById(id);
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

  return updated;
};

export const remove = async (id: number) => {
  const existing = await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Milestone", String(id));
  return existing;
};
