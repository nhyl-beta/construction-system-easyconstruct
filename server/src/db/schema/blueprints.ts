import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const blueprints = pgTable("blueprints", {
  id: serial("id").primaryKey(),
  drawingNumber: varchar("drawing_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  folder: varchar("folder", { length: 100 }).notNull(),
  discipline: varchar("discipline", { length: 50 }),
  scale: varchar("scale", { length: 20 }),
  revision: varchar("revision", { length: 20 }).notNull().default("A"),
  author: varchar("author", { length: 100 }).notNull(),
  approval: varchar("approval", { length: 50 }).notNull().default("Pending"),
  status: varchar("status", { length: 50 }).notNull().default("Current"),
  fileType: varchar("file_type", { length: 20 }).notNull().default("DWG"),
  sizeKb: integer("size_kb").notNull().default(0),
  favorite: boolean("favorite").notNull().default(false),
  tags: text("tags"), // comma-separated — no tag table yet
  issueDate: timestamp("issue_date").defaultNow(),
  latestRevisionDate: timestamp("latest_revision_date").defaultNow(),
});

export type Blueprint = typeof blueprints.$inferSelect;
export type NewBlueprint = typeof blueprints.$inferInsert;
