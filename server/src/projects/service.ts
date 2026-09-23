import * as repo           from "./repository.js";
import * as projectMemberRepo from "../project-members/repository.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/errors.js";
import { assertProjectWritable } from "../lifecycle/service.js";
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
  // Every project starts at Proposal/0% regardless of what the client sent —
  // see lifecycle/phases.ts. statusTone follows PHASE_TONE rather than the
  // schema's stale 'muted' default.
  return await repo.create({
    ...input,
    status: "Proposal",
    statusTone: "neutral",
    progress: 0,
  });
};

export const update = async (id: number, input: UpdateProjectInput) => {
  // Defense in depth: project-validator.ts's updateProjectSchema already
  // omits these, so a well-formed request never reaches here carrying them —
  // this only fires if something bypasses that schema.
  const attempted = input as Record<string, unknown>;
  if ("status" in attempted || "progress" in attempted || "statusTone" in attempted) {
    throw new ValidationError(
      "status/progress are lifecycle-owned — use the /lifecycle endpoints instead of PATCH /projects/:id",
    );
  }
  const existing = await getById(id);
  await assertProjectWritable(existing.code);
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
