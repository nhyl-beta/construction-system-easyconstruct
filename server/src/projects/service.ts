import * as repo           from "./repository.js";
import * as projectMemberRepo from "../project-members/repository.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilters,
} from "./types.js";

/**
 * Consultant is an advisory role: it sees the projects it actually advises
 * on, and only the operational facts relevant to that advice. Commercial
 * terms (contract value, budget utilisation) and staffing headcount are not
 * part of an advisory remit, so they are dropped here rather than merely
 * hidden in the UI — a client-side omission still ships the numbers over the
 * wire to anyone who opens devtools.
 */
const CONSULTANT_HIDDEN_FIELDS = [
  "contractValue",
  "budget",
  "workforce",
] as const;

function toConsultantView(project: Awaited<ReturnType<typeof repo.findAll>>[number]) {
  const scoped: Record<string, unknown> = { ...project };
  for (const field of CONSULTANT_HIDDEN_FIELDS) delete scoped[field];
  return scoped;
}

export interface ProjectScope {
  role: string;
  userId: number;
}

/**
 * Roles whose project visibility is their staffing, not the whole portfolio.
 *
 * These are the roles a PM assigns onto a project through project_members
 * (see db/schema/project-members.ts): an engineer, architect, site personnel
 * or consultant is staffed onto specific jobs and has no business reading
 * the commercial and schedule detail of every other job in the company.
 *
 * Deliberately NOT on this list:
 *  - admin / it-designer / owner — org-wide oversight is their entire remit;
 *  - project-manager — runs the portfolio and staffs these very rows;
 *  - human-resources / finance-manager — payroll, budgets and expenses are
 *    company-wide functions that span every project by definition.
 *
 * Enforced here rather than in the UI on purpose: hiding a row on the client
 * still ships it over the wire to anyone who opens devtools.
 */
const MEMBERSHIP_SCOPED_ROLES = new Set([
  "engineer",
  "architect",
  "site-personnel",
  "consultant",
]);

/** Project codes the given user is actually staffed on, in any role. */
const assignedProjectCodes = async (userId: number): Promise<Set<string>> => {
  const memberships = await projectMemberRepo.findAll({ userId });
  return new Set(memberships.map((m) => m.projectCode));
};

export const getAll = async (
  filters: ProjectFilters,
  scope?: ProjectScope,
) => {
  const projects = await repo.findAll(filters);

  if (!scope || !MEMBERSHIP_SCOPED_ROLES.has(scope.role)) return projects;

  const assigned = await assignedProjectCodes(scope.userId);
  const visible = projects.filter((project) => assigned.has(project.code));

  // Consultant additionally loses the commercial columns: it is an advisory
  // role, so contract value, budget utilisation and headcount are outside
  // its remit even on the projects it does advise on.
  return scope.role === "consultant" ? visible.map(toConsultantView) : visible;
};

export const getById = async (id: number, scope?: ProjectScope) => {
  const project = await repo.findById(id);
  if (!project) throw new NotFoundError('Project', String(id));

  // Same rule as the list. Without it, a staff member who could not see a
  // project in the table could still open it by guessing its id.
  if (scope && MEMBERSHIP_SCOPED_ROLES.has(scope.role)) {
    const assigned = await assignedProjectCodes(scope.userId);
    if (!assigned.has(project.code)) {
      throw new ForbiddenError(
        "You can only open projects you are assigned to",
      );
    }
    if (scope.role === "consultant") {
      return toConsultantView(project) as typeof project;
    }
  }

  return project;
};

export const getByCode = async (code: string) => {
  const project = await repo.findByCode(code);
  if (!project) throw new NotFoundError('Project', code);
  return project;
};

export const create = async (input: CreateProjectInput) => {
  return await repo.create(input);
};

export const update = async (id: number, input: UpdateProjectInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError('Project', String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Project', String(id));
  return deleted;
};
/**
 * Field-level scoping for Engineer on project updates.
 *
 * Engineers report progress against the projects they are staffed on; they
 * are not project owners. Anything else on the record — schedule, budget,
 * client, PM, risk — stays with the Project Manager. Creating and deleting
 * projects is refused at the route level (projects/routes.ts).
 */
const ENGINEER_UPDATABLE_FIELDS = new Set(["progress"]);

export const assertCanUpdateProject = async (
  projectCode: string,
  input: UpdateProjectInput,
  actor: { role: string; userId: number },
) => {
  if (actor.role !== "engineer") return;

  const attempted = Object.keys(input).filter(
    (key) => input[key as keyof UpdateProjectInput] !== undefined,
  );
  const disallowed = attempted.filter(
    (field) => !ENGINEER_UPDATABLE_FIELDS.has(field),
  );

  if (disallowed.length > 0) {
    throw new ForbiddenError(
      `Engineers can only update project progress; ${disallowed.join(", ")} is the Project Manager's to change`,
    );
  }

  const memberships = await projectMemberRepo.findAll({
    userId: actor.userId,
    role: "engineer",
  });
  if (!memberships.some((m) => m.projectCode === projectCode)) {
    throw new ForbiddenError(
      "You can only update progress on projects you are assigned to",
    );
  }
};
