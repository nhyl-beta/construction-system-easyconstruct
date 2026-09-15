// server/src/documents/repository.ts — NEW
import { and, eq, SQL } from "drizzle-orm";
import { db } from "../db/connection.js";
import { documents } from "../db/schema/documents.js";
import type { CreateDocumentInput, DocumentFilters } from "./types.js";

export const findAll = async (filters: DocumentFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.project) conditions.push(eq(documents.project, filters.project));
  if (filters.type && filters.type !== "all") conditions.push(eq(documents.type, filters.type));

  return conditions.length
    ? await db.select().from(documents).where(and(...conditions))
    : await db.select().from(documents);
};

export const create = async (data: CreateDocumentInput) => {
  const [created] = await db.insert(documents).values(data).returning();
  return created;
};