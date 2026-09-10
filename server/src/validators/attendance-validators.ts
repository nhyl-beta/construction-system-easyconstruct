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
  clockIn: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  clockOut: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM").optional(),
  geofence: z.enum(["Inside", "Edge", "Outside"]).optional(),
  photo: z.enum(["Verified", "Pending", "Failed"]).optional(),
  status: z.enum(["Verified", "Pending", "Flagged"]).optional(),
  attendanceStatus: attendanceStatusEnum.optional(),
  remarks: z.string().max(500).optional(),
  logDate: z.string().min(1, "Date is required"),
});

export const updateAttendanceSchema = createAttendanceSchema.partial();
