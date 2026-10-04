import * as repo           from "./repository.js";
import * as projectMemberRepo from "../project-members/repository.js";
import * as usersRepo from "../users/repository.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/errors.js";
import { assertProjectWritable } from "../lifecycle/service.js";
import { sortProjects } from "./ordering.js";
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
  /** Display name — the fallback match for projects whose pmUserId is unset. */
  name?: string;
}

/**
 * Project Managers see and open only the projects assigned to them. Same
 * rule lifecycle/service.ts uses for "is this caller the project's own PM":
 * the pm_user_id link when set, the `pm` display name while it is still null.
 */
export const isOwnProject = (
  project: { pmUserId: number | null; pm: string },
  scope: ProjectScope,
): boolean =>
  project.pmUserId != null
    ? project.pmUserId === scope.userId
    : !!scope.name && project.pm === scope.name;

/**
 * Narrows any project-scoped list (tasks, issues, requirements, milestones…)
 * to the caller's own projects when the caller is a Project Manager; every
 * other role passes through untouched. One helper so each module's list
 * endpoint applies the identical rule instead of re-deriving it.
 */
export const scopeRowsToPm = async <T>(
  auth: { id: number; role: string; name: string } | undefined,
  rows: T[],
  codeOf: (row: T) => string | null | undefined,
): Promise<T[]> => {
  if (auth?.role !== "project-manager") return rows;
  const mine = await projectCodesForPm({ role: auth.role, userId: auth.id, name: auth.name });
  return rows.filter((row) => {
    const code = codeOf(row);
    return !!code && mine.has(code);
  });
};

/** Project codes a Project Manager is assigned to (for other modules' scoping). */
export const projectCodesForPm = async (scope: ProjectScope): Promise<Set<string>> => {
  const projects = await repo.findAll({});
  return new Set(projects.filter((p) => isOwnProject(p, scope)).map((p) => p.code));
};

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

/**
 * The project codes this caller may see, by the same rules as the project list
 * and getById: a PM's own projects, a staffed role's assigned projects, and
 * `null` (no restriction) for everyone else. Lets other modules scope their own
 * lists without copying the visibility rules.
 */
export const visibleProjectCodes = async (scope?: ProjectScope): Promise<Set<string> | null> => {
  if (!scope) return null;
  if (scope.role === "project-manager") return projectCodesForPm(scope);
  if (MEMBERSHIP_SCOPED_ROLES.has(scope.role)) return assignedProjectCodes(scope.userId);
  return null;
};

const visibleProjects = async (filters: ProjectFilters, scope?: ProjectScope) => {
  // A Project Manager's portfolio is the projects assigned to them — applied
  // in the query itself, so the list, the dashboard counts built from it and
  // every paged/filtered variant agree on what "mine" means.
  const projects = await repo.findAll(
    scope?.role === "project-manager"
      ? { ...filters, pmUserId: scope.userId, pmName: scope.name }
      : filters,
  );

  if (!scope || !MEMBERSHIP_SCOPED_ROLES.has(scope.role)) return sortProjects(projects);

  const assigned = await assignedProjectCodes(scope.userId);
  const visible = sortProjects(projects.filter((project) => assigned.has(project.code)));

  // Consultant additionally loses the commercial columns: it is an advisory
  // role, so contract value, budget utilisation and headcount are outside
  // its remit even on the projects it does advise on.
  return scope.role === "consultant" ? visible.map(toConsultantView) : visible;
};

export const getAll = async (filters: ProjectFilters, scope?: ProjectScope) =>
  visibleProjects({ ...filters, page: undefined, pageSize: undefined }, scope);

/** Server-side pagination: the filtered, scoped list sliced to one page. */
export const getPage = async (filters: ProjectFilters, scope?: ProjectScope) => {
  const all = await visibleProjects(filters, scope);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 10, 1), 100);
  const pages = Math.max(Math.ceil(all.length / pageSize), 1);
  const page = Math.min(Math.max(filters.page ?? 1, 1), pages);
  return {
    items: all.slice((page - 1) * pageSize, page * pageSize),
    meta: { total: all.length, page, pageSize, pages },
  };
};

export const getById = async (id: number, scope?: ProjectScope) => {
  const project = await repo.findById(id);
  if (!project) throw new NotFoundError('Project', String(id));

  // Same rule as the list. Without it, a Project Manager could open (or edit,
  // or delete) another PM's project by guessing its id.
  if (scope?.role === "project-manager" && !isOwnProject(project, scope)) {
    throw new ForbiddenError("You can only open projects assigned to you");
  }

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

/** The project-manager account whose display name is `name`, if exactly one. */
const findPmUserId = async (name: string | undefined): Promise<number | undefined> => {
  if (!name) return undefined;
  const pms = (await usersRepo.findAll({ role: "project-manager" })).filter((u) => u.name === name);
  return pms.length === 1 ? pms[0]!.id : undefined;
};

export const create = async (input: CreateProjectInput, pmUserId?: number) => {
  pmUserId ??= await findPmUserId(input.pm);
  // Every project starts at Proposal/0% regardless of what the client sent —
  // see lifecycle/phases.ts. statusTone follows PHASE_TONE rather than the
  // schema's stale 'muted' default.
  return await repo.create({
    ...input,
    status: "Proposal",
    statusTone: "neutral",
    progress: 0,
    // Link the PM by id so ownership survives a rename — see isOwnProject.
    ...(pmUserId != null ? { pmUserId } : {}),
  });
};

export const update = async (id: number, input: UpdateProjectInput, scope?: ProjectScope) => {
  // Defense in depth: project-validator.ts's updateProjectSchema already
  // omits these, so a well-formed request never reaches here carrying them —
  // this only fires if something bypasses that schema.
  const attempted = input as Record<string, unknown>;
  if ("status" in attempted || "progress" in attempted || "statusTone" in attempted) {
    throw new ValidationError(
      "status/progress are lifecycle-owned — use the /lifecycle endpoints instead of PATCH /projects/:id",
    );
  }
  const existing = await getById(id, scope);
  await assertProjectWritable(existing.code);
  // Reassigning the PM by name must move the ownership link with it, or the
  // previous PM keeps seeing the project and the new one can't.
  const reassignedPmUserId =
    input.pm && input.pm !== existing.pm ? await findPmUserId(input.pm) : undefined;
  const updated = await repo.update(
    id,
    input,
    input.pm && input.pm !== existing.pm ? (reassignedPmUserId ?? null) : undefined,
  );
  if (!updated) throw new NotFoundError('Project', String(id));
  return updated;
};

export const remove = async (id: number, scope?: ProjectScope) => {
  await getById(id, scope);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Project', String(id));
  return deleted;
};
