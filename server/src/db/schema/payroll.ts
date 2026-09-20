import {
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  empId: varchar("emp_id", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  initials: varchar("initials", { length: 5 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  hours: integer("hours").notNull().default(0),
  overtime: integer("overtime").notNull().default(0),
  gross: numeric("gross", { precision: 10, scale: 2 }).notNull(),
  // Philippine statutory deductions, each computed on its own base — see
  // payroll/ph-statutory.ts. `deductions` stays as the total of the four so
  // existing readers (Finance payroll review, batch rollups) keep working.
  sss: numeric("sss", { precision: 10, scale: 2 }).notNull().default("0"),
  philhealth: numeric("philhealth", { precision: 10, scale: 2 }).notNull().default("0"),
  pagibig: numeric("pagibig", { precision: 10, scale: 2 }).notNull().default("0"),
  withholdingTax: numeric("withholding_tax", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  deductions: numeric("deductions", { precision: 10, scale: 2 }).notNull(),
  net: numeric("net", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("Pending"),
  period: varchar("period", { length: 50 }).notNull(),
  periodStart: varchar("period_start", { length: 10 }),
  periodEnd: varchar("period_end", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Payroll = typeof payroll.$inferSelect;
export type NewPayroll = typeof payroll.$inferInsert;
