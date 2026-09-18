import { pgTable, serial, varchar, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users.js';

// Represents "this engineer is available/staffed on this project" — a PM
// marks an engineer available here; Architects then assign one of these to
// a design (see designs.assignedEngineerId).
export const projectEngineers = pgTable('project_engineers', {
  id: serial('id').primaryKey(),
  projectCode: varchar('project_code', { length: 50 }).notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  userName: varchar('user_name', { length: 100 }).notNull(),
  addedBy: varchar('added_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  unique('project_engineers_project_user_unique').on(table.projectCode, table.userId),
]);

export type ProjectEngineer = typeof projectEngineers.$inferSelect;
export type NewProjectEngineer = typeof projectEngineers.$inferInsert;
