import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const requirements = pgTable("requirements", {
  id: serial("id").primaryKey(),
  requirementId: varchar("requirement_id", { length: 20 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  project: varchar("project", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("Draft"),
  createdBy: varchar("created_by", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type RequirementRow = typeof requirements.$inferSelect;
export type NewRequirementRow = typeof requirements.$inferInsert;