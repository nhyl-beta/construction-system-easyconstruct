import {
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  initials: varchar("initials", { length: 5 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  site: varchar("site", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  payRate: numeric("pay_rate", { precision: 12, scale: 2 }).notNull().default("0"),
  rateType: varchar("rate_type", { length: 20 }).notNull().default("Hourly"),
  status: varchar("status", { length: 50 }).notNull().default("Active"),
  attendanceRate: integer("attendance_rate").notNull().default(100),
  performance: numeric("performance", { precision: 3, scale: 1 })
    .notNull()
    .default("4.0"),
  hiredOn: varchar("hired_on", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
