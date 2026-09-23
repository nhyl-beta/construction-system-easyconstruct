import { db } from "../db/connection.js";
import { requirements } from "../db/schema/requirements.js";
import { projects } from "../db/schema/projects.js";
import { and, desc, eq, ilike, SQL } from "drizzle-orm";
import { ForbiddenError, ValidationError } from "../utils/errors.js";
import { assertProjectWritable, refreshProjectProgress } from "../lifecycle/service.js";
import type {
  CreateRequirementInput,
  UpdateRequirementInput,
  RequirementFilters,
} from "./types.js";

// The engineer who authors a requirement may move it as far as "Under
// Review" — asking for a decision — but deciding it (Approved/Rejected) is
// the Project Manager's call, same split as engineering reports.
const DECISION_STATUSES = new Set(["Approved", "Rejected"]);

const assertCanSetStatus = (status: string | undefined, actorRole: string) => {
  if (!status || !DECISION_STATUSES.has(status)) return;
  if (actorRole === "admin" || actorRole === "project-manager") return;
  throw new ForbiddenError(
    `Role '${actorRole}' cannot set a requirement to '${status}'; only the Project Manager or Admin can decide it`,
  );
};

export const findAll = async (filters: RequirementFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.project && filters.project !== "all") {
    conditions.push(eq(requirements.project, filters.project));
  }
  if (filters.category && filters.category !== "all") {
    conditions.push(eq(requirements.category, filters.category));
  }
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(requirements.status, filters.status));
  }
  if (filters.search) {
    conditions.push(ilike(requirements.title, `%${filters.search}%`));
  }

  const query = db.select().from(requirements).orderBy(desc(requirements.updatedAt));
  return conditions.length ? await query.where(and(...conditions)) : await query;
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(requirements).where(eq(requirements.id, id));
  return row ?? null;
};

export const create = async (data: CreateRequirementInput) => {
  const [project] = await db.select().from(projects).where(eq(projects.code, data.project));
  if (!project) {
    throw new ValidationError(`No project found with code "${data.project}"`);
  }
  await assertProjectWritable(data.project);
  const requirementId =
    data.requirementId ??
    `REQ-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const [created] = await db
    .insert(requirements)
    .values({ ...data, requirementId })
    .returning();
  if (!created) throw new Error("Failed to create requirement");
  await refreshProjectProgress(created.project);
  return created;
};

export const update = async (
  id: number,
  data: UpdateRequirementInput,
  actorRole: string,
) => {
  assertCanSetStatus(data.status, actorRole);
  const existing = await findById(id);
  if (existing) await assertProjectWritable(existing.project);
  const [updated] = await db
    .update(requirements)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(requirements.id, id))
    .returning();
  if (updated) await refreshProjectProgress(updated.project);
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(requirements).where(eq(requirements.id, id)).returning();
  if (deleted) await refreshProjectProgress(deleted.project);
  return deleted ?? null;
};