import {
  date,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 20 }).notNull(),
  site: varchar("site", { length: 255 }).notNull(),
  clockIn: varchar("clock_in", { length: 10 }).notNull(),
  clockOut: varchar("clock_out", { length: 10 }),
  hours: numeric("hours", { precision: 4, scale: 1 }),
  geofence: varchar("geofence", { length: 20 }).notNull().default("Inside"),
  photo: varchar("photo", { length: 20 }).notNull().default("Pending"),
  status: varchar("status", { length: 20 }).notNull().default("Pending"),
  logDate: date("log_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
