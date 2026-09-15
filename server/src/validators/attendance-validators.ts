// server/src/validators/attendance-validators.ts — PATCHED (add coordinates/photo/projectCode)
import { z } from "zod";

export const attendanceStatusEnum = z.enum([
  "Present",
  "Absent",
  "Late",
  "On Leave",
  "Half Day",
]);

export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  site: z.string().min(1, "Site is required"),
  projectCode: z.string().max(50).optional(),
  clockIn: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  clockOut: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  photoUrl: z.string().max(500).optional(),
  attendanceStatus: attendanceStatusEnum.optional(),
  remarks: z.string().max(500).optional(),
  logDate: z.string().min(1, "Date is required"),
});

export const updateAttendanceSchema = createAttendanceSchema.partial();