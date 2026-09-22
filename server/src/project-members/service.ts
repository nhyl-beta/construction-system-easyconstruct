import { ConflictError, ForbiddenError, NotFoundError } from "../utils/errors.js";
import * as projectsService from "../projects/service.js";
import * as notificationsService from "../notifications/service.js";
import * as repo from "./repository.js";
import type { CreateProjectMemberInput, ProjectMemberFilters } from "./types.js";

const PRIVILEGED_ROLES = ["admin", "it-designer"];

// Same ownership rule as the documents PM-scoping fix: a project-manager may
// only mutate assignments on a project they actually manage (projects.pm).
// Admin/IT Designer bypass this, same as everywhere else in the app.
const assertCanManageProject = async (projectCode: string, requesterRole: string, requesterName: string) => {
  if (PRIVILEGED_ROLES.includes(requesterRole)) return;
  const project = await projectsService.getByCode(projectCode);
  if (project.pm !== requesterName) {
    throw new ForbiddenError("You can only manage the workforce of projects you manage");
  }
};

export const getAll = async (filters: ProjectMemberFilters) => repo.findAll(filters);

export const create = async (
  input: CreateProjectMemberInput,
  requesterRole: string,
  requesterName: string,
) => {
  await assertCanManageProject(input.projectCode, requesterRole, requesterName);
  const existing = await repo.findAll({ projectCode: input.projectCode });
  if (existing.some((e) => e.userId === input.userId && e.role === input.role)) {
    throw new ConflictError("This person is already staffed on this project in that role");
  }
  const created = await repo.create(input);
  if (!created) throw new Error("Failed to add project member");

  // Architect had no way to learn they'd been staffed on a project short of
  // stumbling onto it in the project list — notify the same way every other
  // role-scoped event does (see notifications/service.ts).
  if (created.role === "architect") {
    await notificationsService.create({
      recipientRole: "architect",
      title: "Assigned to a project",
      body: `${created.userName} was assigned to project ${created.projectCode}.`,
      link: `/architect/projects`,
    });
  }

  return created;
};

export const remove = async (id: number, requesterRole: string, requesterName: string) => {
  const target = await repo.findById(id);
  if (!target) throw new NotFoundError("Project member", String(id));
  await assertCanManageProject(target.projectCode, requesterRole, requesterName);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Project member", String(id));

  if (deleted.role === "architect") {
    await notificationsService.create({
      recipientRole: "architect",
      title: "Removed from a project",
      body: `${deleted.userName} was removed from project ${deleted.projectCode}.`,
      link: `/architect/projects`,
    });
  }

  return deleted;
};
