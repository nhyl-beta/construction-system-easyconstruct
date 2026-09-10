import { NotFoundError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type {
  AttendanceFilters,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "./types.js";

// Total Hours = clockOut − clockIn, both "HH:MM" 24h strings. Rounded to 1 decimal.
// If clockOut is not yet recorded, hours is left null (shift still in progress).
function computeHours(clockIn: string, clockOut?: string): string | undefined {
  if (!clockOut) return undefined;
  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);
  const minutes = outH * 60 + outM - (inH * 60 + inM);
  if (Number.isNaN(minutes) || minutes <= 0) return undefined;
  return (minutes / 60).toFixed(1);
}

export const getAll = async (filters: AttendanceFilters) => {
  return await repo.findAll(filters);
};

export const getById = async (id: number) => {
  const record = await repo.findById(id);
  if (!record) throw new NotFoundError("Attendance record", String(id));
  return record;
};

export const create = async (input: CreateAttendanceInput) => {
  return await repo.create({
    ...input,
    attendanceStatus: input.attendanceStatus ?? "Present",
    hours: computeHours(input.clockIn, input.clockOut),
  });
};

export const update = async (id: number, input: UpdateAttendanceInput) => {
  const existing = await getById(id);
  const clockIn = input.clockIn ?? existing.clockIn;
  const clockOut = input.clockOut ?? existing.clockOut ?? undefined;

  const updated = await repo.update(id, {
    ...input,
    hours: computeHours(clockIn, clockOut),
  });
  if (!updated) throw new NotFoundError("Attendance record", String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Attendance record", String(id));
  return deleted;
};
