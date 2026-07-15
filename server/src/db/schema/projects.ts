import {
  pgTable, serial, varchar,
  integer, text, timestamp,
} from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id:          serial('id').primaryKey(),
  name:        varchar('name',        { length: 255 }).notNull(),
  code:        varchar('code',        { length: 50  }).notNull().unique(),
  pm:          varchar('pm',          { length: 100 }).notNull(),
  status:      varchar('status',      { length: 50  }).notNull().default('Planning'),
  statusTone:  varchar('status_tone', { length: 50  }).notNull().default('muted'),
  progress:    integer('progress').notNull().default(0),
  budget:      integer('budget').notNull().default(0),
  due:         varchar('due',         { length: 20  }).notNull(),
  risk:        varchar('risk',        { length: 20  }).notNull().default('Low'),
  location:    varchar('location',    { length: 255 }),
  client:      varchar('client',      { length: 255 }),
  workforce:   integer('workforce').default(0),
  description: text('description'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

export type Project    = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;