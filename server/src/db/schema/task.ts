// server/src/db/schema/task.ts — NEW
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskCode: varchar("task_code", { length: 20 }).notNull().unique(),
  projectCode: varchar("project_code", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).notNull().default("Medium"), // Low | Medium | High
  status: varchar("status", { length: 20 }).notNull().default("Pending"),    // Pending | In Progress | Completed
  progress: integer("progress").notNull().default(0),
  dueDate: varchar("due_date", { length: 20 }),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  assignedToName: varchar("assigned_to_name", { length: 100 }), // denormalized display fallback
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;