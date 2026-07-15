import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  proposalId: varchar("proposal_id", { length: 20 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  projectCode: varchar("project_code", { length: 50 }).notNull(),
  submittedBy: varchar("submitted_by", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  amount: varchar("amount", { length: 50 }),
  content: text("content"),
  aiValidation: text("ai_validation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
