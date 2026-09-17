// server/src/issues/service.ts — NEW
import { db } from "../db/connection.js";
import { projects } from "../db/schema/projects.js";
import { eq } from "drizzle-orm";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type { CreateIssueInput, IssueFilters } from "./types.js";

export const getAll = async (filters: IssueFilters) => repo.findAll(filters);

export const getById = async (id: number) => {
  const issue = await repo.findById(id);
  if (!issue) throw new NotFoundError("Issue", String(id));
  return issue;
};

export const create = async (input: CreateIssueInput) => {
  const [project] = await db.select().from(projects).where(eq(projects.code, input.projectCode));
  if (!project) {
    throw new ValidationError(`No project found with code "${input.projectCode}"`);
  }
  const issue = await repo.create(input);
  if (!issue) throw new Error("Failed to create issue");
  return issue;
};

// Only reviewers can set an official resolution; the reporter can only view.
export const updateStatus = async (id: number, status: string, resolutionNotes: string | undefined, actingRole: string) => {
  await getById(id);
  if (!["project_manager", "engineer"].includes(actingRole)) {
    throw new ForbiddenError("Only Project Managers or Engineers can update issue status");
  }
  const updated = await repo.updateStatus(id, status, resolutionNotes);
  if (!updated) throw new NotFoundError("Issue", String(id));
  return updated;
};