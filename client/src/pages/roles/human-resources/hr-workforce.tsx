import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/pages/roles/shared/shared-hr";
import { useWorkforceReport } from "@/features/hr/hooks/use-hr";
import { useState } from "react";

export default function HRWorkforcePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { report, loading, error } = useWorkforceReport(from || undefined, to || undefined);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Workforce reporting"
        subtitle="Headcount, site allocation, and attendance trends from persisted HR records"
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted-foreground">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="ml-2 h-9 rounded-lg border bg-background px-2 text-sm" /></label>
        <label className="text-xs text-muted-foreground">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="ml-2 h-9 rounded-lg border bg-background px-2 text-sm" /></label>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading workforce report…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Headcount", report.totals.headcount],
              ["Active", report.totals.active],
              ["On leave", report.totals.onLeave],
              ["Suspended", report.totals.suspended],
              ["Attendance records", report.totals.attendanceRecords],
            ].map(([label, value]) => (
              <Card key={String(label)} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-2xl font-semibold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">By department</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.byDepartment.map((row) => (
                  <div key={row.department} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                    <span>{row.department}</span><span className="text-muted-foreground">{row.active} active / {row.headcount} total</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">By site</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.bySite.map((row) => (
                  <div key={row.site} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                    <span>{row.site}</span><span className="text-muted-foreground">{row.present} present / {row.headcount} assigned</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Daily attendance</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {report.dailyAttendance.length === 0 && <p className="text-sm text-muted-foreground">No attendance records in the selected range.</p>}
              {report.dailyAttendance.map((row) => (
                <div key={row.date} className="grid grid-cols-4 border-b py-2 text-sm last:border-0">
                  <span>{row.date}</span><span className="text-success">Present {row.present}</span><span className="text-warning">Late {row.late}</span><span className="text-destructive">Absent {row.absent}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
