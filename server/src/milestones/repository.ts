// server/src/milestones/repository.ts — NEW
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/connection.js";
import { milestones, milestoneLinks } from "../db/schema/milestones.js";
import { tasks } from "../db/schema/task.js";
import type { CreateMilestoneInput, CreateMilestoneLinkInput, UpdateMilestoneInput } from "./types.js";

export const findAll = async (projectCode?: string) => {
  const query = db.select().from(milestones).orderBy(asc(milestones.createdAt));
  return projectCode ? query.where(eq(milestones.projectCode, projectCode)) : query;
};

export const findById = async (id: number) => {
  const [row] = await db.select().from(milestones).where(eq(milestones.id, id));
  return row ?? null;
};

export const create = async (
  data: CreateMilestoneInput & { createdBy: string; status: string },
) => {
  const [created] = await db.insert(milestones).values(data).returning();
  return created ?? null;
};

export const update = async (id: number, data: UpdateMilestoneInput) => {
  const [updated] = await db
    .update(milestones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(milestones.id, id))
    .returning();
  return updated ?? null;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(milestones).where(eq(milestones.id, id)).returning();
  return deleted ?? null;
};

// ── Links (F4) ───────────────────────────────────────────────────────────

export const findLinks = async (milestoneId: number) => {
  const links = await db.select().from(milestoneLinks).where(eq(milestoneLinks.milestoneId, milestoneId));
  const taskLinkIds = links.filter((l) => l.linkType === "task").map((l) => l.linkId);
  const linkedTasks = taskLinkIds.length
    ? await db.select().from(tasks).where(inArray(tasks.id, taskLinkIds))
    : [];
  const taskById = new Map(linkedTasks.map((t) => [t.id, t]));

  return links.map((link) => {
    if (link.linkType !== "task") return { ...link, task: undefined };
    const t = taskById.get(link.linkId);
    return {
      ...link,
      task: t
        ? { id: t.id, title: t.title, status: t.status, assignedToUserId: t.assignedToUserId, assignedToName: t.assignedToName }
        : null,
    };
  });
};

export const createLink = async (milestoneId: number, data: CreateMilestoneLinkInput) => {
  const [created] = await db
    .insert(milestoneLinks)
    .values({ milestoneId, linkType: data.linkType, linkId: data.linkId })
    .returning();
  return created ?? null;
};

export const findLinkById = async (id: number) => {
  const [row] = await db.select().from(milestoneLinks).where(eq(milestoneLinks.id, id));
  return row ?? null;
};

export const removeLink = async (id: number) => {
  const [deleted] = await db.delete(milestoneLinks).where(eq(milestoneLinks.id, id)).returning();
  return deleted ?? null;
};
