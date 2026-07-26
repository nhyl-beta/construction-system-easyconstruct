import {
  pgTable, serial, varchar,
  integer, text, timestamp,
} from 'drizzle-orm/pg-core';

export const designs = pgTable('designs', {
  id:             serial('id').primaryKey(),
  code:           varchar('code',            { length: 50  }).notNull().unique(),
  name:           varchar('name',            { length: 255 }).notNull(),
  projectCode:    varchar('project_code',    { length: 50  }).notNull(), // free-text, mirrors projects.code / proposals.projectCode convention
  discipline:     varchar('discipline',      { length: 50  }).notNull(),
  category:       varchar('category',        { length: 50  }).notNull(),
  phase:          varchar('phase',           { length: 50  }).notNull().default('Design Development'),
  version:        varchar('version',         { length: 20  }).notNull().default('v0.1'),
  revision:       integer('revision').notNull().default(0),
  status:         varchar('status',          { length: 50  }).notNull().default('Draft'),
  leadArchitect:  varchar('lead_architect',  { length: 100 }).notNull(),
  client:         varchar('client',          { length: 255 }),
  building:       varchar('building',        { length: 100 }),
  floor:          varchar('floor',           { length: 50  }),
  zone:           varchar('zone',            { length: 50  }),
  description:    text('description'),
  fileCount:      integer('file_count').notNull().default(0),
  aiCompleteness: integer('ai_completeness').notNull().default(0),
  aiConfidence:   integer('ai_confidence').notNull().default(0),
  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
});

export type Design    = typeof designs.$inferSelect;
export type NewDesign = typeof designs.$inferInsert;