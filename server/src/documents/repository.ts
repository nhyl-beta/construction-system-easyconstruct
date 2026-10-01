// server/src/documents/repository.ts — NEW
import { and, eq, inArray, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { documents } from "../db/schema/documents.js";
import { projects } from "../db/schema/projects.js";
import { proposals } from "../db/schema/proposals.js";
import { designs } from "../db/schema/designs.js";
import type { RelatedType } from "./advisory.js";
import type { CreateDocumentInput, DocumentFilters } from "./types.js";

export const findAll = async (filters: DocumentFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.project) conditions.push(eq(documents.project, filters.project));
  if (filters.type && filters.type !== "all") conditions.push(eq(documents.type, filters.type));
  if (filters.projectCodes) conditions.push(inArray(documents.project, filters.projectCodes));
  if (filters.stage) conditions.push(eq(documents.stage, filters.stage));

  return conditions.length
    ? await db.select().from(documents).where(and(...conditions))
    : await db.select().from(documents);
};

export const findProjectCodesForPm = async (pmName: string) => {
  const rows = await db.select({ code: projects.code }).from(projects).where(eq(projects.pm, pmName));
  return rows.map((r) => r.code);
};

// I: the project a proposal/design belongs to, for the same-project check.
export const findRelatedItem = async (type: RelatedType, id: number) => {
  if (type === "proposal") {
    const [row] = await db.select({ projectCode: proposals.projectCode }).from(proposals).where(eq(proposals.id, id));
    return row ?? null;
  }
  const [row] = await db.select({ projectCode: designs.projectCode }).from(designs).where(eq(designs.id, id));
  return row ?? null;
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(documents).where(eq(documents.id, id));
  return row ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(documents).where(eq(documents.id, id)).returning();
  return deleted ?? null;
};

export const create = async (data: CreateDocumentInput) => {
  const [created] = await db.insert(documents).values(data).returning();
  return created;
};