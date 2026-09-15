import { db } from "../db/connection.js";
import { engineeringReports } from "../db/schema/engineering-reports.js";
import { and, desc, eq, ilike, SQL } from "drizzle-orm";
import type {
  CreateEngineeringReportInput,
  UpdateEngineeringReportInput,
  EngineeringReportFilters,
} from "./types.js";

export const findAll = async (filters: EngineeringReportFilters = {}) => {
  const conditions: SQL[] = [];
  if (filters.project && filters.project !== "all") {
    conditions.push(eq(engineeringReports.project, filters.project));
  }
  if (filters.type && filters.type !== "all") {
    conditions.push(eq(engineeringReports.type, filters.type));
  }
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(engineeringReports.status, filters.status));
  }
  if (filters.search) {
    conditions.push(ilike(engineeringReports.title, `%${filters.search}%`));
  }

  const query = db
    .select()
    .from(engineeringReports)
    .orderBy(desc(engineeringReports.updatedAt));
  return conditions.length ? await query.where(and(...conditions)) : await query;
};

export const findById = async (id: number) => {
  const [row] = await db
    .select()
    .from(engineeringReports)
    .where(eq(engineeringReports.id, id));
  return row ?? null;
};

export const create = async (data: CreateEngineeringReportInput) => {
  const [created] = await db.insert(engineeringReports).values(data).returning();
  return created;
};

export const update = async (id: number, data: UpdateEngineeringReportInput) => {
  const [updated] = await db
    .update(engineeringReports)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(engineeringReports.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db
    .delete(engineeringReports)
    .where(eq(engineeringReports.id, id))
    .returning();
  return deleted ?? null;
};