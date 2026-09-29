// client/src/features/attendance/offline/queue.ts — NEW (E1)
import { uploadsRepository } from "@/features/uploads/repositories/uploads.repository";
import { attendanceRepository } from "../repositories/attendance.repository";
import {
  deletePending,
  getAllPending,
  putPending,
  type PendingAttendanceEntry,
} from "./db";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function generateClientRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function enqueueAttendance(input: {
  employeeId: string;
  site: string;
  projectCode: string;
  clockIn: string;
  logDate: string;
  latitude: number;
  longitude: number;
  geofence: "Inside" | "Outside" | "Unverified";
  photo: Blob;
  photoType: string;
}): Promise<string> {
  const clientRequestId = generateClientRequestId();
  await putPending({ ...input, clientRequestId, createdAt: Date.now() });
  return clientRequestId;
}

export async function listPendingCount(): Promise<number> {
  return (await getAllPending()).length;
}

/** Uploads the queued photo, then submits the clock-in with the same
 * clientRequestId the entry was created with — the server's idempotent
 * upsert (attendance/service.ts) means a retried sync after a partial
 * failure (upload succeeded, clock-in call then dropped) never double-books. */
async function syncOne(entry: PendingAttendanceEntry): Promise<void> {
  const dataUrl = await blobToDataUrl(entry.photo);
  const uploadRes = await uploadsRepository.upload(
    `attendance-${entry.clientRequestId}.jpg`,
    entry.photoType || "image/jpeg",
    dataUrl,
  );

  await attendanceRepository.clockIn({
    employeeId: entry.employeeId,
    site: entry.site,
    projectCode: entry.projectCode,
    clockIn: entry.clockIn,
    latitude: entry.latitude,
    longitude: entry.longitude,
    photoUrl: uploadRes.data.url,
    logDate: entry.logDate,
    clientRequestId: entry.clientRequestId,
    validatedOffline: true,
  });

  await deletePending(entry.clientRequestId);
}

export interface SyncResult {
  synced: number;
  failed: number;
}

/** Drains the queue one entry at a time (not in parallel — a burst of
 * simultaneous uploads on a just-restored, possibly still-flaky connection
 * is more likely to fail than a sequential drain). A failed entry stays
 * queued with its error recorded, so the next online event or manual retry
 * tries it again rather than losing it. */
export async function syncPendingAttendance(): Promise<SyncResult> {
  const pending = await getAllPending();
  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      await syncOne(entry);
      synced += 1;
    } catch (err) {
      failed += 1;
      await putPending({
        ...entry,
        syncError: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  return { synced, failed };
}
