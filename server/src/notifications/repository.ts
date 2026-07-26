import { db } from "../db/connection.js";
import { notifications } from "../db/schema/notifications.js";
import { eq, and, desc, SQL } from "drizzle-orm";
import type {
  CreateNotificationInput,
  NotificationFilters,
} from "./types.js";

export const findAll = async (filters: NotificationFilters = {}) => {
  const conditions: SQL[] = [];

  if (filters.recipientRole) {
    conditions.push(eq(notifications.role, filters.recipientRole));
  }

  if (filters.unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  return conditions.length
    ? db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
    : db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt));
};

export const create = async (data: CreateNotificationInput) => {
  const [created] = await db
    .insert(notifications)
    .values(data)
    .returning();

  return created;
};

export const markRead = async (id: number) => {
  const [updated] = await db
    .update(notifications)
    .set({
      isRead: true,
    })
    .where(eq(notifications.id, id))
    .returning();

  return updated ?? null;
};