// src/pages/roles/human-resources/hr-payroll.tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/refine-ui/data-table/data-table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import {
  Checkpoint,
  KpiMini,
  PageHeader,
  StatusBadge,
} from "@/pages/roles/shared/shared-hr";
import { useEffect, useMemo, useState } from "react";
import {
  generatePayroll,
  getAttendanceSummary,
  listPayroll,
  listPayrollBatches,
  type GeneratePayrollEntry,
  type PayrollBatch,
  type PayrollLine,
} from "@/features/hr/payroll-api";
import { listEmployees } from "@/features/hr/hr-api";
import type { Employee } from "@/features/hr/types";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { ProjectPicker } from "@/components/shared/project-picker";
import { downloadCsv } from "@/lib/export-csv";
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency";
import { PayrollPeriodPicker } from "@/components/shared/payroll-period-picker";

// Delegates to the shared peso formatter — this used to hardcode "$".
function money(n: number) {
  return formatCompactCurrency(n);
}

function batchStatusLabel(status: string) {
  switch (status) {
    case "approved":
      return "Approved by Finance";
    case "rejected":
      return "Rejected by Finance";
    case "processing":
      return "Processing";
    default:
      return "Pending Finance Review";
  }
}

export default function HRPayrollPage() {
  const [rows, setRows] = useState<PayrollLine[]>([]);
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodInput, setPeriodInput] = useState("");
  const [groupInput, setGroupInput] = useState("All departments");
  const [projectCodeInput, setProjectCodeInput] = useState("");
  const [hoursInput, setHoursInput] = useState("160");
  const [overtimeInput, setOvertimeInput] = useState("0");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  // G5: entries pulled from verified attendance for the selected project,
  // keyed by employeeId — takes over from the flat hours/overtime inputs
  // (which still apply to anyone attendance had nothing verified for).
  const [attendanceEntries, setAttendanceEntries] = useState<Map<string, GeneratePayrollEntry> | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const handlePrefillFromAttendance = async () => {
    if (!projectCodeInput.trim()) return;
    setLoadingAttendance(true);
    setError(null);
    try {
      const entries = await getAttendanceSummary(projectCodeInput.trim());
      setAttendanceEntries(new Map(entries.map((e) => [e.employeeId, e])));
    } catch (prefillError) {
      setError(
        prefillError instanceof Error
          ? prefillError.message
          : "Failed to load verified attendance for this project.",
      );
    } finally {
      setLoadingAttendance(false);
    }
  };

  // The Export button was rendered with no handler at all — clicking it did
  // nothing. Exports the tracksheet currently on screen.
  const handleExportCsv = () => {
    downloadCsv(
      "payroll-tracksheet",
      [
        "Employee ID",
        "Name",
        "Role",
        "Period",
        "Hours",
        "Overtime",
        "Gross",
        "SSS",
        "PhilHealth",
        "Pag-IBIG",
        "Withholding Tax",
        "Deductions",
        "Net",
        "Status",
      ],
      rows.map((r) => [
        r.empId,
        r.name,
        r.role,
        r.period,
        r.hours,
        r.overtime,
        r.gross,
        r.sss,
        r.philhealth,
        r.pagibig,
        r.withholdingTax,
        r.deductions,
        r.net,
        r.status,
      ]),
    );
  };
  const [generating, setGenerating] = useState(false);

  const loadPayroll = async () => {
    setError(null);

    try {
      const [payrollLines, payrollBatches, availableEmployees] =
        await Promise.all([
          listPayroll(),
          listPayrollBatches(),
          listEmployees({ status: "Active" }),
        ]);

      setRows(payrollLines);
      setBatches(payrollBatches);
      setEmployees(availableEmployees);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load payroll data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPayroll();
  }, []);

  const currentBatch = useMemo(
    () =>
      [...batches].sort((a, b) => {
        const aTime = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
        const bTime = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
        return bTime - aTime || b.id.localeCompare(a.id);
      })[0] ?? null,
    [batches],
  );

  async function refreshStatus() {
    setRefreshing(true);
    await loadPayroll();
  }

  async function handleGeneratePayroll() {
    if (!periodInput.trim() || employees.length === 0) {
      setError(
        employees.length === 0
          ? "No active employees are available for payroll generation."
          : "Enter a payroll period before generating.",
      );
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      await generatePayroll({
        period: periodInput.trim(),
        group: groupInput.trim() || "All departments",
        projectCode: projectCodeInput.trim() || undefined,
        entries: employees.map((employee) => {
          const attended = attendanceEntries?.get(employee.id);
          return attended
            ? { employeeId: employee.id, hoursWorked: attended.hoursWorked, overtimeHours: attended.overtimeHours ?? 0 }
            : {
                employeeId: employee.id,
                hoursWorked: Number(hoursInput) || 0,
                overtimeHours: Number(overtimeInput) || 0,
              };
        }),
      });

      setShowGenerateForm(false);
      setAttendanceEntries(null);
      await loadPayroll();
    } catch (generationError) {
      console.error(generationError);
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Failed to generate payroll.",
      );
    } finally {
      setGenerating(false);
    }
  }

  const totals = useMemo(() => {
    const gross = rows.reduce((s, r) => s + r.gross, 0);
    const net = rows.reduce((s, r) => s + r.net, 0);
    // Overtime cost isolated at the same effective rate implied by gross vs.
    // regular hours would require the hourly rate per row; as a simple proxy
    // we show overtime hours × (gross ÷ total hours) as an approximate cost.
    const totalHours = rows.reduce((s, r) => s + r.hours + r.overtime, 0) || 1;
    const avgRate = gross / totalHours;
    const overtimeHours = rows.reduce((s, r) => s + r.overtime, 0);
    const overtimeCost = overtimeHours * avgRate * 1.5;
    return { gross, net, overtimeCost };
  }, [rows]);

  const pagination = usePagination(rows, 10);
  const period = rows[0]?.period ?? "Current period";
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const awaitingApproval =
    currentBatch?.status === "pending" ? 1 : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Payroll"
        subtitle="Gross labor, deductions, net payable, and approvals"
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => void refreshStatus()}
              disabled={loading || refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              {refreshing ? "Refreshing…" : "Refresh Status"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              disabled={rows.length === 0}
              title={rows.length === 0 ? "No payroll lines to export" : "Export the tracksheet as CSV"}
              onClick={handleExportCsv}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setShowGenerateForm((visible) => !visible)
              }
            >
              Generate Payroll <ArrowUpRight className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showGenerateForm && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">
              Generate Payroll Batch
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              This creates payroll lines and a pending batch for Finance review.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-5">
            <PayrollPeriodPicker
              value={periodInput}
              onChange={setPeriodInput}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
            <input
              className="h-9 rounded-md border bg-background px-3 text-sm"
              placeholder="Group"
              value={groupInput}
              onChange={(event) =>
                setGroupInput(event.target.value)
              }
            />
            <ProjectPicker
              value={projectCodeInput}
              onChange={(code) => {
                setProjectCodeInput(code);
                setAttendanceEntries(null);
              }}
              placeholder="Project code"
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
            <input
              className="h-9 rounded-md border bg-background px-3 text-sm"
              type="number"
              min="0"
              placeholder="Hours"
              value={hoursInput}
              onChange={(event) =>
                setHoursInput(event.target.value)
              }
            />
            <input
              className="h-9 rounded-md border bg-background px-3 text-sm"
              type="number"
              min="0"
              placeholder="Overtime"
              value={overtimeInput}
              onChange={(event) =>
                setOvertimeInput(event.target.value)
              }
            />
            <div className="flex flex-wrap items-center gap-2 md:col-span-5">
              <Button
                variant="outline"
                onClick={() => void handlePrefillFromAttendance()}
                disabled={!projectCodeInput.trim() || loadingAttendance}
                title={!projectCodeInput.trim() ? "Select a project first" : "Prefill hours from verified attendance"}
              >
                {loadingAttendance ? "Loading attendance…" : "Prefill from attendance"}
              </Button>
              {attendanceEntries && (
                <span className="text-xs text-muted-foreground">
                  {attendanceEntries.size} employee(s) with verified attendance — the rest fall back to the hours/overtime fields above.
                </span>
              )}
              <Button
                onClick={() => void handleGeneratePayroll()}
                disabled={generating}
              >
                {generating ? "Generating…" : "Create Pending Batch"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowGenerateForm(false)}
                disabled={generating}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiMini
          label="Gross labor (period)"
          value={money(totals.gross)}
          tone="info"
          icon={Wallet}
        />
        <KpiMini
          label="Net payable"
          value={money(totals.net)}
          tone="success"
          icon={CheckCircle2}
        />
        <KpiMini
          label="Overtime cost"
          value={money(totals.overtimeCost)}
          tone="warning"
          icon={Clock}
        />
        <KpiMini
          label="Awaiting approval"
          value={String(awaitingApproval)}
          tone="warning"
          icon={AlertTriangle}
        />
      </div>

      {currentBatch && (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Payroll Batch {currentBatch.id}
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {batchStatusLabel(currentBatch.status)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentBatch.status === "pending"
                  ? "This payroll batch has been generated by HR and is currently waiting for Finance Manager review."
                  : currentBatch.status === "approved"
                    ? "Finance has approved this payroll batch. The payroll is ready to proceed to the next processing stage."
                    : currentBatch.status === "rejected"
                      ? "Finance rejected this payroll batch. Review the payroll information and submit a corrected batch."
                      : "This payroll batch is being processed."}
              </p>
              {currentBatch.reviewedBy && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Reviewed by {currentBatch.reviewedBy}
                  {currentBatch.reviewedAt
                    ? ` · ${new Date(currentBatch.reviewedAt).toLocaleString()}`
                    : ""}
                </p>
              )}
            </div>
            <StatusBadge status={batchStatusLabel(currentBatch.status)} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tracksheet</CardTitle>
            <p className="text-xs text-muted-foreground">
              {period} · {rows.length} employees · {totalHours.toLocaleString()} hours logged
            </p>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  {/* Philippine statutory withholdings, each on its own base
                      — the single "Deductions" figure was a flat 12% of gross
                      standing in for all four, which could not be explained to
                      an employee looking at their payslip. */}
                  <TableHead className="text-right">SSS</TableHead>
                  <TableHead className="text-right">PhilHealth</TableHead>
                  <TableHead className="text-right">Pag-IBIG</TableHead>
                  <TableHead className="text-right">W/Tax</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                      Loading payroll…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                      No payroll generated yet for this period.
                    </TableCell>
                  </TableRow>
                )}
                {pagination.pageItems.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">
                            {p.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {p.empId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.role}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {p.hours}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {p.overtime}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(p.gross)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(p.sss)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(p.philhealth)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(p.pagibig)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(p.withholdingTax)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      −{formatCurrency(p.deductions)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(p.net)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 0 && (
              <div className="px-4 pt-3">
                <DataTablePagination {...pagination} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Period summary</CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribution & checkpoints
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Total payable</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">
                ${totals.net.toLocaleString()}
              </div>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Base wages",
                  value: totals.gross ? Math.round(((totals.gross - totals.overtimeCost) / totals.gross) * 100) : 0,
                  amount: money(totals.gross - totals.overtimeCost),
                },
                {
                  label: "Overtime",
                  value: totals.gross ? Math.round((totals.overtimeCost / totals.gross) * 100) : 0,
                  amount: money(totals.overtimeCost),
                },
                {
                  label: "Deductions",
                  value: totals.gross ? Math.round(((totals.gross - totals.net) / totals.gross) * 100) : 0,
                  amount: money(totals.gross - totals.net),
                },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{s.label}</span>
                    <span className="text-muted-foreground">{s.amount}</span>
                  </div>
                  <Progress value={s.value} className="mt-1 h-1.5" />
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2 text-xs">
              <Checkpoint label="Attendance reconciled" done />
              <Checkpoint label="Gross labor verified" done={rows.length > 0} />
              <Checkpoint
                label="Manager approvals"
                done={currentBatch?.status === "approved"}
              />
              <Checkpoint label="Disbursement initiated" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
