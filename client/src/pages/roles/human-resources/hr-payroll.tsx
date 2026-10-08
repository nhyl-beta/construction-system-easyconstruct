// src/pages/roles/human-resources/hr-payroll.tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { KpiMini, PageHeader, StatusBadge } from "@/pages/roles/shared/shared-hr";
import { useEffect, useMemo, useState } from "react";
import {
  getContributionReport,
  listPayroll,
  listPayrollBatches,
  reasonLabel,
  getBatchDetail,
  type Agency,
  type BatchDecision,
  type PayrollBatch,
  type PayrollLine,
} from "@/features/hr/payroll-api";
import { BatchStatusPill } from "@/features/hr/components/batch-status-pill";
import { PayrollWizard } from "@/features/hr/components/payroll-wizard";
import { PayslipDialog } from "@/features/hr/components/payslip-dialog";
import { AlertTriangle, ArrowUpRight, Building2, CheckCircle2, Download, FileText, RefreshCw, Wallet } from "lucide-react";
import { downloadCsv } from "@/lib/export-csv";
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_PERIODS = "all";

const AGENCIES: Array<{ key: Agency; label: string }> = [
  { key: "sss", label: "SSS" },
  { key: "philhealth", label: "PhilHealth" },
  { key: "pagibig", label: "Pag-IBIG" },
];

export default function HRPayrollPage() {
  const [rows, setRows] = useState<PayrollLine[]>([]);
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [resumeBatchId, setResumeBatchId] = useState<string | null>(null);
  const [payslipLine, setPayslipLine] = useState<PayrollLine | null>(null);
  const [lastRejection, setLastRejection] = useState<Record<string, BatchDecision | undefined>>({});
  // F1: the filter drives what the tracksheet below actually displays.
  const [trackFilterPeriod, setTrackFilterPeriod] = useState<string | null>(null);

  const loadPayroll = async (period: string | null = trackFilterPeriod) => {
    setError(null);
    try {
      const [payrollLines, payrollBatches] = await Promise.all([
        listPayroll(period ?? undefined),
        listPayrollBatches(),
      ]);
      setRows(payrollLines);
      setBatches(payrollBatches);

      // For each batch Finance sent back, fetch why — shown at the top.
      const revisions = payrollBatches.filter((b) => b.status === "revision_required");
      const details = await Promise.all(revisions.map((b) => getBatchDetail(b.id)));
      setLastRejection(
        Object.fromEntries(
          details.map((d) => [
            d.batch.id,
            [...d.decisions].reverse().find((x) => x.action === "rejected"),
          ]),
        ),
      );
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load payroll data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trackPeriods = useMemo(
    () => Array.from(new Set(batches.map((b) => b.period))).sort().reverse(),
    [batches],
  );

  const revisionBatches = batches.filter((b) => b.status === "revision_required");
  const awaitingApproval = batches.filter((b) => b.status === "pending").length;

  const openWizard = (batchId: string | null) => {
    setResumeBatchId(batchId);
    setWizardOpen(true);
  };

  const handleTrackFilterChange = (period: string | null) => {
    setTrackFilterPeriod(period);
    void loadPayroll(period);
  };

  const handleExportCsv = () => {
    downloadCsv(
      "payroll-tracksheet",
      [
        "Employee ID", "Name", "Role", "Period", "Hours", "Overtime", "Adjustments", "Gross",
        "SSS", "PhilHealth", "Pag-IBIG", "Withholding Tax", "Deductions", "Net",
        "Employer SSS", "Employer EC", "Employer PhilHealth", "Employer Pag-IBIG", "Employer cost", "Status",
      ],
      rows.map((r) => [
        r.empId, r.name, r.role, r.period, r.hours, r.overtime, r.adjustments, r.gross,
        r.sss, r.philhealth, r.pagibig, r.withholdingTax, r.deductions, r.net,
        r.employerSss, r.employerEc, r.employerPhilhealth, r.employerPagibig, r.employerCost, r.status,
      ]),
    );
  };

  // Liabilities per agency for one approved period. The system only reports
  // them; it does not remit anything to SSS, PhilHealth, Pag-IBIG or BIR.
  const handleExportContributions = async (agency: Agency, label: string) => {
    if (!trackFilterPeriod) return;
    try {
      const report = await getContributionReport(agency, trackFilterPeriod);
      downloadCsv(
        `${agency}-contributions-${trackFilterPeriod}`,
        [
          "Batch", "Project", "Employee ID", "Name", "Period",
          `${label} employee share`, `${label} employer share`,
          ...(agency === "sss" ? ["EC (employer)"] : []), "Rate version",
        ],
        report.map((r) => [
          r.batchId, r.projectCode ?? "", r.empId, r.name, r.period, r.employeeShare, r.employerShare,
          ...(agency === "sss" ? [r.ec ?? 0] : []), r.rateVersion,
        ]),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export the contribution report.");
    }
  };

  const totals = useMemo(
    () => ({
      gross: rows.reduce((s, r) => s + r.gross, 0),
      net: rows.reduce((s, r) => s + r.net, 0),
      employerCost: rows.reduce((s, r) => s + r.employerCost, 0),
    }),
    [rows],
  );

  const pagination = usePagination(rows, 10);
  const period = rows[0]?.period ?? "Current period";
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);

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
             
              onClick={() => {
                setRefreshing(true);
                void loadPayroll();
              }}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh Status"}
            </Button>
            <Button
              size="sm"
              variant="outline"
             
              disabled={rows.length === 0}
              title={rows.length === 0 ? "No payroll lines to export" : "Export the tracksheet as CSV"}
              onClick={handleExportCsv}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => openWizard(null)}>
              Generate Payroll <ArrowUpRight className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-strong">
          {error}
        </div>
      )}

      {revisionBatches.map((b) => {
        const why = lastRejection[b.id];
        return (
          <div
            key={b.id}
            className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="text-sm">
              <div className="font-semibold">
                Finance sent {b.id} ({b.period}) back for revision
              </div>
              <div className="mt-1">
                Reason: <span className="font-medium">{reasonLabel(why?.reasonCode ?? "") || "Not recorded"}</span>
                {why?.comment ? ` — ${why.comment}` : ""}
              </div>
            </div>
            <Button size="sm" onClick={() => openWizard(b.id)}>
              Fix and resubmit
            </Button>
          </div>
        );
      })}

      {wizardOpen && (
        <PayrollWizard
          key={resumeBatchId ?? "new"}
          resumeBatchId={resumeBatchId}
          onClose={() => setWizardOpen(false)}
          onChanged={() => void loadPayroll()}
        />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiMini label="Gross labor (period)" value={formatCompactCurrency(totals.gross)} tone="info" icon={Wallet} />
        <KpiMini label="Net payable" value={formatCompactCurrency(totals.net)} tone="success" icon={CheckCircle2} />
        <KpiMini label="Employer cost" value={formatCompactCurrency(totals.employerCost)} tone="warning" icon={Building2} />
        <KpiMini label="Awaiting Finance" value={String(awaitingApproval)} tone="warning" icon={AlertTriangle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Batches</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                    No batches yet.
                  </TableCell>
                </TableRow>
              )}
              {batches.slice(0, 8).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id}</TableCell>
                  <TableCell className="text-sm">{b.projectCode ?? "—"}</TableCell>
                  <TableCell className="text-sm">{b.period}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.employees}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(b.netPayroll)}</TableCell>
                  <TableCell className="text-sm">{b.round}</TableCell>
                  <TableCell>
                    <BatchStatusPill status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {(b.status === "draft" || b.status === "revision_required") && (
                      <Button size="sm" variant="outline" onClick={() => openWizard(b.id)}>
                        {b.status === "draft" ? "Continue" : "Fix and resubmit"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Tracksheet</CardTitle>
            <p className="text-xs text-muted-foreground">
              {period} · {rows.length} employees · {totalHours.toLocaleString()} hours logged
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {AGENCIES.map((a) => (
              <Button
                key={a.key}
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={!trackFilterPeriod}
                title={trackFilterPeriod ? `Export ${a.label} contribution report` : "Choose a period to export a contribution report"}
                onClick={() => void handleExportContributions(a.key, a.label)}
              >
                <FileText className="h-3.5 w-3.5" /> {a.label}
              </Button>
            ))}
            <Select
              value={trackFilterPeriod ?? ALL_PERIODS}
              onValueChange={(v) => handleTrackFilterChange(v === ALL_PERIODS ? null : v)}
            >
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PERIODS}>All periods</SelectItem>
                {trackPeriods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <TableHead className="text-right">SSS</TableHead>
                <TableHead className="text-right">PhilHealth</TableHead>
                <TableHead className="text-right">Pag-IBIG</TableHead>
                <TableHead className="text-right">W/Tax</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={13} className="py-8 text-center text-sm text-muted-foreground">
                    Loading payroll…
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="py-8 text-center text-sm text-muted-foreground">
                    No payroll generated yet for this period.
                  </TableCell>
                </TableRow>
              )}
              {pagination.pageItems.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary-soft text-overline font-semibold text-primary-strong">
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="font-mono text-overline text-muted-foreground">{p.empId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.role}</TableCell>
                  <TableCell className="text-right text-sm">{p.hours}</TableCell>
                  <TableCell className="text-right text-sm">{p.overtime}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatCurrency(p.gross)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(p.sss)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(p.philhealth)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(p.pagibig)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(p.withholdingTax)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">−{formatCurrency(p.deductions)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrency(p.net)}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setPayslipLine(p)}>
                      Payslip
                    </Button>
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

      <PayslipDialog line={payslipLine} onClose={() => setPayslipLine(null)} />
    </div>
  );
}
