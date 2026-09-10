import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { PageHeader } from "@/pages/roles/shared/shared-hr";

import {
  useEmployees,
  useAttendance,
} from "@/features/hr/hooks/use-hr";

export default function HRWorkforcePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useEmployees();

  const {
    records,
    loading: attendanceLoading,
    error: attendanceError,
  } = useAttendance({
    dateFrom: from || undefined,
    dateTo: to || undefined,
  });

  const loading = employeesLoading || attendanceLoading;
  const error = employeesError ?? attendanceError;

  const totals = useMemo(() => {
    const headcount = employees.length;

    const active = employees.filter(
      (employee) => employee.status === "Active",
    ).length;

    const onLeave = employees.filter(
      (employee) => employee.status === "On Leave",
    ).length;

    const suspended = employees.filter(
      (employee) => employee.status === "Suspended",
    ).length;

    return {
      headcount,
      active,
      onLeave,
      suspended,
      attendanceRecords: records.length,
    };
  }, [employees, records]);

  const byDepartment = useMemo(() => {
    const departments = new Map<
      string,
      {
        department: string;
        headcount: number;
        active: number;
      }
    >();

    for (const employee of employees) {
      const existing = departments.get(employee.department);

      if (existing) {
        existing.headcount += 1;

        if (employee.status === "Active") {
          existing.active += 1;
        }
      } else {
        departments.set(employee.department, {
          department: employee.department,
          headcount: 1,
          active: employee.status === "Active" ? 1 : 0,
        });
      }
    }

    return Array.from(departments.values()).sort((a, b) =>
      a.department.localeCompare(b.department),
    );
  }, [employees]);

  const bySite = useMemo(() => {
    const sites = new Map<
      string,
      {
        site: string;
        headcount: number;
        present: number;
      }
    >();

    for (const employee of employees) {
      const existing = sites.get(employee.site);

      if (existing) {
        existing.headcount += 1;
      } else {
        sites.set(employee.site, {
          site: employee.site,
          headcount: 1,
          present: 0,
        });
      }
    }

    for (const record of records) {
      const existing = sites.get(record.site);

      if (existing && record.attendanceStatus === "Present") {
        existing.present += 1;
      }
    }

    return Array.from(sites.values()).sort((a, b) =>
      a.site.localeCompare(b.site),
    );
  }, [employees, records]);

  const dailyAttendance = useMemo(() => {
    const daily = new Map<
      string,
      {
        date: string;
        present: number;
        late: number;
        absent: number;
      }
    >();

    for (const record of records) {
      const existing = daily.get(record.logDate);

      if (!existing) {
        daily.set(record.logDate, {
          date: record.logDate,
          present: record.attendanceStatus === "Present" ? 1 : 0,
          late: record.attendanceStatus === "Late" ? 1 : 0,
          absent: record.attendanceStatus === "Absent" ? 1 : 0,
        });

        continue;
      }

      if (record.attendanceStatus === "Present") {
        existing.present += 1;
      }

      if (record.attendanceStatus === "Late") {
        existing.late += 1;
      }

      if (record.attendanceStatus === "Absent") {
        existing.absent += 1;
      }
    }

    return Array.from(daily.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [records]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Workforce reporting"
        subtitle="Headcount, site allocation, and attendance trends from persisted HR records"
      />

      {/* Date filters */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted-foreground">
          <span className="mb-1 block">From</span>

          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-9 rounded-lg border bg-background px-2 text-sm"
          />
        </label>

        <label className="text-xs text-muted-foreground">
          <span className="mb-1 block">To</span>

          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-9 rounded-lg border bg-background px-2 text-sm"
          />
        </label>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm text-muted-foreground">
          Loading workforce data…
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Workforce summary */}
      {!loading && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Headcount", totals.headcount],
              ["Active", totals.active],
              ["On leave", totals.onLeave],
              ["Suspended", totals.suspended],
              ["Attendance records", totals.attendanceRecords],
            ].map(([label, value]) => (
              <Card
                key={String(label)}
                className="rounded-2xl"
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-semibold">
                    {value}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Department and Site */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">
                  By department
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {byDepartment.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No employee records found.
                  </p>
                ) : (
                  byDepartment.map((row) => (
                    <div
                      key={row.department}
                      className="flex items-center justify-between border-b py-2 text-sm last:border-0"
                    >
                      <span>{row.department}</span>

                      <span className="text-muted-foreground">
                        {row.active} active / {row.headcount} total
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">
                  By site
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {bySite.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No site assignments found.
                  </p>
                ) : (
                  bySite.map((row) => (
                    <div
                      key={row.site}
                      className="flex items-center justify-between border-b py-2 text-sm last:border-0"
                    >
                      <span>{row.site}</span>

                      <span className="text-muted-foreground">
                        {row.present} present / {row.headcount} assigned
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily attendance */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">
                Daily attendance
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {dailyAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No attendance records in the selected range.
                </p>
              ) : (
                dailyAttendance.map((row) => (
                  <div
                    key={row.date}
                    className="grid grid-cols-4 border-b py-2 text-sm last:border-0"
                  >
                    <span>{row.date}</span>

                    <span className="text-success">
                      Present {row.present}
                    </span>

                    <span className="text-warning">
                      Late {row.late}
                    </span>

                    <span className="text-destructive">
                      Absent {row.absent}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
