// server/src/documents/repository.ts — NEW
import { and, eq, inArray, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { documents } from "../db/schema/documents.js";
import { projects } from "../db/schema/projects.js";
import type { CreateDocumentInput, DocumentFilters } from "./types.js";

export const findAll = async (filters: DocumentFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.project) conditions.push(eq(documents.project, filters.project));
  if (filters.type && filters.type !== "all") conditions.push(eq(documents.type, filters.type));
  if (filters.projectCodes) conditions.push(inArray(documents.project, filters.projectCodes));

  return conditions.length
    ? await db.select().from(documents).where(and(...conditions))
    : await db.select().from(documents);
};

export const findProjectCodesForPm = async (pmName: string) => {
  const rows = await db.select({ code: projects.code }).from(projects).where(eq(projects.pm, pmName));
  return rows.map((r) => r.code);
};

export const create = async (data: CreateDocumentInput) => {
  const [created] = await db.insert(documents).values(data).returning();
  return created;
};