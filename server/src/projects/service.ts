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

export const getAll = async (
  filters: ProjectFilters,
  scope?: ProjectScope,
) => {
  const projects = await repo.findAll(filters);

  if (scope?.role !== "consultant") return projects;

  // Scoped to the projects this consultant is actually staffed on
  // (project_members rows with role "consultant").
  const memberships = await projectMemberRepo.findAll({
    userId: scope.userId,
    role: "consultant",
  });
  const advisedCodes = new Set(memberships.map((m) => m.projectCode));

  return projects
    .filter((project) => advisedCodes.has(project.code))
    .map(toConsultantView);
};

export const getById = async (id: number) => {
  const project = await repo.findById(id);
  if (!project) throw new NotFoundError('Project', String(id));
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
