import { and, eq, ilike, inArray, or, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { designEngineers } from "../db/schema/design-engineers.js";
import { designs } from "../db/schema/designs.js";
import type {
  CreateDesignInput,
  DesignFilters,
  UpdateDesignInput,
} from "./types.js";

export const findAll = async (filters: DesignFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.status && filters.status !== "all")
    conditions.push(eq(designs.status, filters.status));

  if (filters.discipline && filters.discipline !== "all")
    conditions.push(eq(designs.discipline, filters.discipline));

  if (filters.projectCode && filters.projectCode !== "all")
    conditions.push(eq(designs.projectCode, filters.projectCode));

  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(designs.name, s),
        ilike(designs.code, s),
        ilike(designs.leadArchitect, s),
      )!,
    );
  }

  return conditions.length
    ? await db
        .select()
        .from(designs)
        .where(and(...conditions))
    : await db.select().from(designs);
};

export const findById = async (id: number) => {
  const [design] = await db.select().from(designs).where(eq(designs.id, id));
  return design ?? null;
};

export const create = async (data: CreateDesignInput) => {
  const [created] = await db.insert(designs).values(data).returning();
  return created;
};

export const update = async (id: number, data: UpdateDesignInput) => {
  const [updated] = await db
    .update(designs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(designs.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db
    .delete(designs)
    .where(eq(designs.id, id))
    .returning();
  return deleted ?? null;
};

// ── Assigned engineers (many-to-many) ───────────────────────────────────────

export const findEngineersForDesigns = async (designIds: number[]) => {
  if (designIds.length === 0) return [];
  return db
    .select()
    .from(designEngineers)
    .where(inArray(designEngineers.designId, designIds));
};

export const findEngineers = async (designId: number) => {
  return db
    .select()
    .from(designEngineers)
    .where(eq(designEngineers.designId, designId));
};

/**
 * Replace a design's engineer set wholesale. The form submits the complete
 * list every time, so a diff would only add a way for the two to disagree.
 */
export const replaceEngineers = async (
  designId: number,
  engineers: Array<{ userId: number; userName: string }>,
) => {
  await db.transaction(async (tx) => {
    await tx.delete(designEngineers).where(eq(designEngineers.designId, designId));
    if (engineers.length > 0) {
      await tx.insert(designEngineers).values(
        engineers.map((e) => ({
          designId,
          userId: e.userId,
          userName: e.userName,
        })),
      );
    }
  });
};
