import { db }       from "../db/connection.js";
import { projects } from "../db/schema/projects.js";
import { eq, ilike, and, or, SQL } from 'drizzle-orm';
import type { CreateProjectInput, UpdateProjectInput, ProjectFilters } from "./types.js";

export const findAll = async (filters: ProjectFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.status && filters.status !== 'all')
    conditions.push(eq(projects.status, filters.status));

  if (filters.risk && filters.risk !== 'all')
    conditions.push(eq(projects.risk, filters.risk));

  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(projects.name, s),
        ilike(projects.code, s),
        ilike(projects.pm,   s),
      )!,
    );
  }

  return conditions.length
    ? await db.select().from(projects).where(and(...conditions))
    : await db.select().from(projects);
};

export const findByCode = async (code: string) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.code, code));
  return project ?? null;
};

export const findById = async (id: number) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id));
  return project ?? null;
};

// drizzle's numeric() columns round-trip as strings, so a contract value or
// site coordinate that arrives as a JSON number has to be stringified before
// it reaches the insert. An empty-string coordinate means "clear it".
const numeric = (value: number | string | null | undefined) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return String(value);
};

const serialize = <T extends CreateProjectInput | UpdateProjectInput>(
  data: T,
): Omit<T, "contractValue" | "siteLatitude" | "siteLongitude"> & {
  contractValue?: string | null;
  siteLatitude?: string | null;
  siteLongitude?: string | null;
} => ({
  ...data,
  contractValue:
    data.contractValue == null ? data.contractValue : String(data.contractValue),
  siteLatitude: numeric(data.siteLatitude),
  siteLongitude: numeric(data.siteLongitude),
});

export const create = async (data: CreateProjectInput) => {
  const [created] = await db.insert(projects).values(serialize(data)).returning();
  return created;
};

export const update = async (id: number, data: UpdateProjectInput) => {
  const [updated] = await db
    .update(projects)
    .set({ ...serialize(data), updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning();
  return deleted ?? null;
};

/**
 * Narrow, single-column update used by lifecycle/service.ts to roll a
 * project's progress up after any write that can change a gate check or
 * task count (by project CODE — most of those writers only carry the code,
 * not the numeric id). Kept separate from the general `update()` above so
 * that roll-up can never accidentally overwrite any other project field.
 */
export const updateProgressByCode = async (code: string, progress: number) => {
  const [updated] = await db
    .update(projects)
    .set({ progress, updatedAt: new Date() })
    .where(eq(projects.code, code))
    .returning();
  return updated ?? null;
};

/**
 * The lifecycle-owned columns (status/progress/previousStatus/holdReason/
 * completedAt/archivedAt) — written ONLY by lifecycle/service.ts's phase
 * transitions and refreshProjectProgress. Kept out of the general
 * `update()`/`UpdateProjectInput` path entirely (see project-validator.ts,
 * projects/routes.ts rejectLifecycleFields) so an ordinary project PATCH can
 * never reach these columns, by construction rather than by convention.
 */
export const updateLifecycleFields = async (
  code: string,
  fields: Partial<{
    status: string;
    statusTone: string;
    progress: number;
    previousStatus: string | null;
    holdReason: string | null;
    completedAt: Date | null;
    archivedAt: Date | null;
  }>,
) => {
  const [updated] = await db
    .update(projects)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(projects.code, code))
    .returning();
  return updated ?? null;
};