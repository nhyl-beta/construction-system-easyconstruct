// server/src/db/schema/projects.ts — PATCHED (add geofence columns; rest unchanged)
import {
  pgTable, serial, varchar,
  integer, text, timestamp, numeric,
} from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id:          serial('id').primaryKey(),
  name:        varchar('name',        { length: 255 }).notNull(),
  code:        varchar('code',        { length: 50  }).notNull().unique(),
  pm:          varchar('pm',          { length: 100 }).notNull(),
  status:      varchar('status',      { length: 50  }).notNull().default('Planning'),
  statusTone:  varchar('status_tone', { length: 50  }).notNull().default('muted'),
  progress:    integer('progress').notNull().default(0),
  // Budget UTILISATION, as a percentage (0-100+). The contract amount lives
  // in contractValue — see ensure-demo-schema.ts.
  budget:      integer('budget').notNull().default(0),
  contractValue: numeric('contract_value', { precision: 14, scale: 2 }),
  due:         varchar('due',         { length: 20  }).notNull(),
  risk:        varchar('risk',        { length: 20  }).notNull().default('Low'),
  location:    varchar('location',    { length: 255 }),
  client:      varchar('client',      { length: 255 }),
  // ISO 4217 code the project's amounts (contractValue, budgets, expenses)
  // are denominated in. Defaults to PHP because that is what every existing
  // row was implicitly stored in before this column existed.
  currency:    varchar('currency',    { length: 3   }).notNull().default('PHP'),
  workforce:   integer('workforce').default(0),
  description: text('description'),
  
  // ── Added for Site Personnel geofenced attendance ──
  siteLatitude:     numeric('site_latitude', { precision: 10, scale: 7 }),
  siteLongitude:    numeric('site_longitude', { precision: 10, scale: 7 }),
  geofenceRadiusM:  integer('geofence_radius_m').default(300),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

export type Project    = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;