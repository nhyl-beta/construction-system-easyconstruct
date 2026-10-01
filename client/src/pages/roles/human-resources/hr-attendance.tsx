import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  KpiMini,
  PageHeader,
  StatusBadge,
} from "@/pages/roles/shared/shared-hr";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listAttendance,
  setAttendanceVerification,
  type AttendanceEntry,
} from "@/features/hr/attendance-api";
import { listEmployees } from "@/features/hr/hr-api";
import { AttendanceVerificationDialog } from "@/components/hr/attendance-verification-dialog";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
} from "lucide-react";

const PAGE_SIZE = 10;
const HEATMAP_DAYS = 14;
const HEATMAP_MAX_SITES = 6;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** A clock-in with no measured breach and no failed photo — safe to verify in bulk. */
const isCleanPending = (l: AttendanceEntry) =>
  l.status === "Pending" && l.geofence !== "Outside" && l.photo !== "Failed";

export default function HRAttendancePage() {
  const [logs, setLogs] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // The clock-in HR is currently confirming — photo and coordinates side by
  // side in AttendanceVerificationDialog.
  const [reviewing, setReviewing] = useState<AttendanceEntry | null>(null);
  const [page, setPage] = useState(1);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const employees = await listEmployees();
    const nameLookup = new Map(
      employees.map((e) => [e.id, { name: e.name, initials: e.initials }]),
    );
    const rows = await listAttendance({}, nameLookup);
    setLogs(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const verify = useCallback(
    async (id: number, status: "Verified" | "Flagged", remarks: string) => {
      await setAttendanceVerification(id, status, remarks || undefined);
      await load();
    },
    [load],
  );

  // Newest first, then paged. The page is clamped when the list shrinks (for
  // example after a bulk verify reloads it).
  const sorted = useMemo(
    () => [...logs].sort((a, b) => b.logDate.localeCompare(a.logDate) || b.clockIn.localeCompare(a.clockIn)),
    [logs],
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstShown = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(currentPage * PAGE_SIZE, sorted.length);

  const bulkTargets = useMemo(() => logs.filter(isCleanPending), [logs]);
  const skippedForReview = useMemo(
    () => logs.filter((l) => l.status === "Pending" && !isCleanPending(l)).length,
    [logs],
  );

  // Verifies every pending clock-in that has no geofence breach or failed
  // photo; those stay for HR to check one by one.
  const runBulkVerify = async () => {
    setBulkBusy(true);
    const results = await Promise.allSettled(
      bulkTargets.map((l) => setAttendanceVerification(l.id, "Verified")),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    await load();
    setBulkBusy(false);
    setConfirmBulk(false);
    if (failed > 0) toast.error(`${bulkTargets.length - failed} verified, ${failed} failed — try again`);
    else toast.success(`${bulkTargets.length} clock-in${bulkTargets.length === 1 ? "" : "s"} verified`);
  };

  // Heatmap + summary stats come from the loaded records: one row per site,
  // one cell per day for the last 14 days, shaded by that day's share of the
  // site's busiest day. Days with no records stay empty.
  const heatmap = useMemo(() => {
    const days: string[] = [];
    const today = new Date();
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(dayKey(d));
    }
    const bySite = new Map<string, Map<string, number>>();
    for (const l of logs) {
      const day = l.logDate.slice(0, 10);
      if (!days.includes(day)) continue;
      const counts = bySite.get(l.site) ?? new Map<string, number>();
      counts.set(day, (counts.get(day) ?? 0) + 1);
      bySite.set(l.site, counts);
    }
    const sites = [...bySite.entries()]
      .map(([site, counts]) => ({
        site,
        total: [...counts.values()].reduce((a, b) => a + b, 0),
        max: Math.max(...counts.values()),
        cells: days.map((day) => ({ day, count: counts.get(day) ?? 0 })),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, HEATMAP_MAX_SITES);

    const worked = logs.filter((l) => l.attendanceStatus === "Present" || l.attendanceStatus === "Late");
    const late = worked.filter((l) => l.attendanceStatus === "Late");
    const onTime = worked.length === 0 ? null : ((worked.length - late.length) / worked.length) * 100;
    const daysWithRecords = new Set(worked.map((l) => l.logDate.slice(0, 10))).size;
    const lateAvg = daysWithRecords === 0 ? null : late.length / daysWithRecords;
    const shifts = logs.filter((l) => l.clockOut && l.hours > 0);
    const avgShift = shifts.length === 0 ? null : shifts.reduce((s, l) => s + l.hours, 0) / shifts.length;
    return { sites, onTime, lateAvg, avgShift };
  }, [logs]);

  const kpis = useMemo(() => {
    const verified = logs.filter((l) => l.status === "Verified").length;
    const pending = logs.filter((l) => l.status === "Pending").length;
    // Only a measured breach counts as a flag. "Unverified" means the fence
    // was never evaluated (no coordinates, or a project with no registered
    // site) — that is work for HR, not a boundary violation.
    const geofenceFlags = logs.filter((l) => l.geofence === "Outside").length;
    const photoFailures = logs.filter((l) => l.photo === "Failed").length;
    return { verified, pending, geofenceFlags, photoFailures };
  }, [logs]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Attendance"
        subtitle="Clock-ins, geofence verification, and photo authentication"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiMini
          label="Verified today"
          value={String(kpis.verified)}
          tone="success"
          icon={CheckCircle2}
        />
        <KpiMini
          label="Pending verification"
          value={String(kpis.pending)}
          tone="warning"
          icon={Clock}
        />
        <KpiMini
          label="Geofence flags"
          value={String(kpis.geofenceFlags)}
          tone="destructive"
          icon={MapPin}
        />
        <KpiMini
          label="Photo auth failures"
          value={String(kpis.photoFailures)}
          tone="destructive"
          icon={Camera}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="min-w-0 rounded-2xl xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">
                Attendance log
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Clock-ins, geofence and photo authentication results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                disabled={loading || bulkTargets.length === 0}
                title={
                  bulkTargets.length === 0
                    ? "No pending clock-ins without a geofence or photo problem"
                    : `Verify ${bulkTargets.length} pending clock-in${bulkTargets.length === 1 ? "" : "s"}`
                }
                onClick={() => setConfirmBulk(true)}
              >
                Bulk verify{bulkTargets.length > 0 ? ` (${bulkTargets.length})` : ""}
              </Button>
              <Button size="sm" className="rounded-xl">
                <ShieldCheck className="h-4 w-4" /> Resolve flags
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden px-0 [&_[data-slot=table-container]]:overflow-x-hidden [&_td]:whitespace-normal [&_td]:break-words [&_td]:px-2 [&_th]:px-2">
            {/* table-fixed + percentage widths (sum 100%) so long names/badges
                wrap instead of forcing the table wider than the card, which
                was producing a horizontal scrollbar. */}
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">Employee</TableHead>
                  <TableHead className="w-[12%]">Site</TableHead>
                  <TableHead className="w-[10%]">Clock in</TableHead>
                  <TableHead className="w-[10%]">Clock out</TableHead>
                  <TableHead className="w-[8%] text-right">Hours</TableHead>
                  <TableHead className="w-[14%]">Geofence</TableHead>
                  <TableHead className="w-[12%]">Photo</TableHead>
                  <TableHead className="w-[10%]">Attendance</TableHead>
                  <TableHead className="w-[6%] text-right">Check</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                      Loading attendance…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                      No attendance records yet.
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">
                            {l.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{l.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {l.employeeId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {l.site}
                      {l.source === "Sheet" && (
                        <Badge
                          variant="outline"
                          className="mt-1 flex w-fit items-center gap-1 rounded-full text-[10px]"
                          title="Imported from a site attendance spreadsheet — needs verification"
                        >
                          <FileSpreadsheet className="h-3 w-3" /> Sheet
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.clockIn}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.clockOut ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {l.hours.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[10px] ${
                          l.geofence === "Inside"
                            ? "border-success/30 text-success"
                            : l.geofence === "Edge"
                            ? "border-warning/30 text-warning"
                            : l.geofence === "Outside"
                            ? "border-destructive/30 text-destructive"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <MapPin className="mr-1 h-3 w-3" /> {l.geofence}
                      </Badge>
                      {l.distanceFromSiteM != null && (
                        <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                          {l.distanceFromSiteM} m from site
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        title="Check the photo and location for this clock-in"
                        onClick={() => setReviewing(l)}
                        className="cursor-pointer"
                      >
                        <Badge
                          variant="outline"
                          className={`rounded-full text-[10px] ${
                            l.photo === "Verified"
                              ? "border-success/30 text-success"
                              : l.photo === "Pending"
                              ? "border-warning/30 text-warning"
                              : l.photo === "Not captured"
                              ? "border-border text-muted-foreground"
                              : "border-destructive/30 text-destructive"
                          }`}
                        >
                          <Camera className="mr-1 h-3 w-3" /> {l.photo}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={l.attendanceStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => setReviewing(l)}
                      >
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sorted.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 pt-3 text-xs text-muted-foreground">
                <span>
                  Showing {firstShown}–{lastShown} of {sorted.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg px-2"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="tabular-nums">
                    Page {currentPage} of {pageCount}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg px-2"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Site heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">
              Clock-ins per day · last {HEATMAP_DAYS} days
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : heatmap.sites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clock-ins in the last {HEATMAP_DAYS} days.
              </p>
            ) : (
              <div className="space-y-3">
                {heatmap.sites.map(({ site, total, max, cells }) => (
                  <div key={site}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium">{site}</span>
                      <span className="shrink-0 text-muted-foreground">{total} in {HEATMAP_DAYS}d</span>
                    </div>
                    <div className="flex gap-1">
                      {cells.map(({ day, count }) => (
                        <div
                          key={day}
                          className={`h-5 flex-1 rounded-sm ${count === 0 ? "bg-muted" : ""}`}
                          style={
                            count === 0
                              ? undefined
                              : {
                                  backgroundColor: `color-mix(in oklch, var(--color-primary) ${Math.round(25 + (count / max) * 75)}%, transparent)`,
                                }
                          }
                          title={`${day}: ${count} clock-in${count === 1 ? "" : "s"}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Separator className="my-4" />
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">On-time rate</span>
                <span className="font-medium text-success">
                  {heatmap.onTime == null ? "—" : `${heatmap.onTime.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Late arrivals (avg)</span>
                <span className="font-medium">
                  {heatmap.lateAvg == null ? "—" : `${heatmap.lateAvg.toFixed(1)} / day`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg shift length</span>
                <span className="font-medium">
                  {heatmap.avgShift == null ? "—" : `${heatmap.avgShift.toFixed(1)} h`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={(open) => !bulkBusy && setConfirmBulk(open)}
        title="Verify pending clock-ins?"
        description={
          `${bulkTargets.length} pending clock-in${bulkTargets.length === 1 ? "" : "s"} will be marked Verified.` +
          (skippedForReview > 0
            ? ` ${skippedForReview} with a geofence breach or failed photo are left for you to check one by one.`
            : "")
        }
        confirmLabel={bulkBusy ? "Verifying…" : "Verify all"}
        destructive={false}
        loading={bulkBusy}
        onConfirm={() => void runBulkVerify()}
      />

      <AttendanceVerificationDialog
        entry={reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
        onVerify={verify}
      />
    </div>
  );
}
