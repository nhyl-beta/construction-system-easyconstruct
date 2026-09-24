import * as repo from "./repository.js";
import * as projectsRepo from "../projects/repository.js";
import * as projectMemberRepo from "../project-members/repository.js";
import { PROJECT_MEMBER_ROLES } from "../db/schema/project-members.js";
import type {
  CreateNotificationInput,
  NotificationFilters,
  NotificationScope,
} from "./types.js";

export const getForRecipient = async (
  scope: NotificationScope,
  filters: NotificationFilters,
) => repo.findForRecipient(scope, filters);

// Called directly by other domain services (e.g. budget-approval-steps) — no HTTP loopback.
export const create = async (input: CreateNotificationInput) => repo.create(input);

export const markRead = async (id: number) => repo.markRead(id);

const isMemberRole = (role: string): boolean =>
  (PROJECT_MEMBER_ROLES as readonly string[]).includes(role);

/**
 * J1: the one project-scoped "tell the relevant roles" call every domain
 * event should use, generalizing lifecycle/service.ts's
 * notifyProjectMembersAndPm + tasks/service.ts's notifyPm (both now thin
 * wrappers around this).
 *
 * A role that can actually be staffed on a project (engineer, architect,
 * site-personnel, consultant) resolves to the real staffed user(s) via
 * project-members — a broadcast to every holder of that role org-wide would
 * reach people with nothing to do with this project. "project-manager" is
 * its own case: the project's own pmUserId, not a project-members row.
 * Every other role (admin, it-designer, finance-manager, human-resources,
 * owner) has no per-project staffing concept, so it's a role broadcast.
 * A staffable role with nobody currently staffed is silently skipped rather
 * than falling back to a role broadcast — there is no one to reach.
 */
export const notifyProject = async (
  projectCode: string,
  roles: string[],
  input: { title: string; body: string; link?: string },
): Promise<void> => {
  const recipientUserIds = new Set<number>();
  const roleBroadcasts = new Set<string>();

  for (const role of new Set(roles)) {
    if (role === "project-manager") {
      const project = await projectsRepo.findByCode(projectCode);
      if (project?.pmUserId != null) recipientUserIds.add(project.pmUserId);
      else roleBroadcasts.add("project-manager");
      continue;
    }
    if (isMemberRole(role)) {
      const members = await projectMemberRepo.findAll({ projectCode, role: role as (typeof PROJECT_MEMBER_ROLES)[number] });
      for (const m of members) recipientUserIds.add(m.userId);
      continue;
    }
    roleBroadcasts.add(role);
  }

  await Promise.all([
    ...Array.from(recipientUserIds).map((recipientUserId) =>
      create({ ...input, recipientUserId, projectCode }),
    ),
    ...Array.from(roleBroadcasts).map((recipientRole) =>
      create({ ...input, recipientRole, projectCode }),
    ),
  ]);
};