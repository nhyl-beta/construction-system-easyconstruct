/*
 * server/src/attendance/service.ts
 */

import { eq } from "drizzle-orm";

import { db } from "../db/connection.js";
import { projects } from "../db/schema/projects.js";
import {
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

import * as repo from "./repository.js";

import type {
  AttendanceFilters,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "./types.js";

/**
 * Calculate worked hours from clock-in and clock-out times.
 *
 * Example:
 * 08:00 -> 17:00 = "9.0"
 *
 * Returns undefined when:
 * - clockOut is missing
 * - the time values are invalid
 * - the calculated duration is zero or negative
 */
function computeHours(
  clockIn: string,
  clockOut?: string,
): string | undefined {
  if (!clockOut) {
    return undefined;
  }

  const [inH = 0, inM = 0] = clockIn
    .split(":")
    .map(Number);

  const [outH = 0, outM = 0] = clockOut
    .split(":")
    .map(Number);

  const values = [inH, inM, outH, outM];

  if (values.some((value) => Number.isNaN(value))) {
    return undefined;
  }

  const minutes =
    outH * 60 +
    outM -
    (inH * 60 + inM);

  if (minutes <= 0) {
    return undefined;
  }

  return (minutes / 60).toFixed(1);
}

/**
 * Calculate the distance between two latitude/longitude
 * coordinates using the Haversine formula.
 *
 * Result is returned in meters.
 */
function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;

  const toRad = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    )
  );
}

/**
 * Get all attendance records.
 */
export const getAll = async (
  filters: AttendanceFilters,
) => {
  return repo.findAll(filters);
};

/**
 * Get a single attendance record.
 */
export const getById = async (id: number) => {
  const record = await repo.findById(id);

  if (!record) {
    throw new NotFoundError(
      "Attendance record",
      String(id),
    );
  }

  return record;
};

/**
 * Create an attendance record.
 *
 * Additional fields:
 * - latitude
 * - longitude
 * - photoUrl
 * - projectCode
 */
export const create = async (
  input: CreateAttendanceInput & {
    projectCode?: string;
    latitude?: number;
    longitude?: number;
    photoUrl?: string;
  },
) => {
  // ---------------------------------------------------------
  // Prevent duplicate attendance for the same employee/day.
  // ---------------------------------------------------------

  const existingToday = await repo.findAll({
    employeeId: input.employeeId,
    dateFrom: input.logDate,
    dateTo: input.logDate,
  });

  if (existingToday.length > 0) {
    throw new ValidationError(
      "Attendance for this employee has already been recorded today",
    );
  }

  // ---------------------------------------------------------
  // Verification photo is required.
  // ---------------------------------------------------------

  if (!input.photoUrl) {
    throw new ValidationError(
      "A verification photo is required to record attendance",
    );
  }

  // ---------------------------------------------------------
  // Geofencing
  // ---------------------------------------------------------

  let geofence = "Outside";

  let distanceFromSiteM:
    | number
    | undefined;

  if (
    input.projectCode &&
    input.latitude != null &&
    input.longitude != null
  ) {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        eq(
          projects.code,
          input.projectCode,
        ),
      );

    if (
      project?.siteLatitude != null &&
      project?.siteLongitude != null
    ) {
      distanceFromSiteM = Math.round(
        distanceMeters(
          input.latitude,
          input.longitude,
          Number(project.siteLatitude),
          Number(project.siteLongitude),
        ),
      );

      const radius =
        project.geofenceRadiusM ?? 300;

      geofence =
        distanceFromSiteM <= radius
          ? "Inside"
          : "Outside";
    }
  }

  // ---------------------------------------------------------
  // Calculate attendance hours.
  // ---------------------------------------------------------

  const hours = computeHours(
    input.clockIn,
    input.clockOut,
  );

  // ---------------------------------------------------------
  // Create attendance record.
  // ---------------------------------------------------------

  return repo.create({
    ...input,
    geofence,
    distanceFromSiteM,
    photo: "Verified",
    status:
      geofence === "Inside"
        ? "Verified"
        : "Flagged",
    attendanceStatus:
      input.attendanceStatus ?? "Present",
    hours,
  } as Parameters<typeof repo.create>[0]);
};

/**
 * Update an attendance record.
 */
export const update = async (
  id: number,
  input: UpdateAttendanceInput,
) => {
  const existing = await getById(id);

  const clockIn =
    input.clockIn ??
    existing.clockIn;

  const clockOut =
    input.clockOut ??
    existing.clockOut ??
    undefined;

  const updated = await repo.update(id, {
    ...input,
    hours: computeHours(
      clockIn,
      clockOut,
    ),
  });

  if (!updated) {
    throw new NotFoundError(
      "Attendance record",
      String(id),
    );
  }

  return updated;
};

/**
 * Delete an attendance record.
 */
export const remove = async (
  id: number,
) => {
  // Make sure the record exists first.
  await getById(id);

  const deleted = await repo.remove(id);

  if (!deleted) {
    throw new NotFoundError(
      "Attendance record",
      String(id),
    );
  }

  return deleted;
};