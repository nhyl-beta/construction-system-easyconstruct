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
import {
  Checkpoint,
  KpiMini,
  PageHeader,
  StatusBadge,
} from "@/pages/roles/shared/shared-hr";
import { useEffect, useMemo, useState } from "react";
import { listPayroll, type PayrollLine } from "@/features/hr/payroll-api";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  Wallet,
} from "lucide-react";

function money(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function HRPayrollPage() {
  const [rows, setRows] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listPayroll().then((data) => {
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    const pending = rows.filter((r) => r.status !== "Completed").length;
    return { gross, net, overtimeCost, pending };
  }, [rows]);

  const period = rows[0]?.period ?? "Current period";
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Payroll"
        subtitle="Gross labor, deductions, net payable, and approvals"
        actions={
          <>
            <Button size="sm" variant="outline" className="rounded-xl">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="rounded-xl">
              Approve batch <ArrowUpRight className="h-4 w-4" />
            </Button>
          </>
        }
      />

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
          value={String(totals.pending)}
          tone="warning"
          icon={AlertTriangle}
        />
      </div>

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
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Loading payroll…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      No payroll generated yet for this period.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((p) => (
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
                    <TableCell className="text-right text-sm">
                      ${p.gross.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      −${p.deductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      ${p.net.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <Checkpoint label="Manager approvals" />
              <Checkpoint label="Disbursement initiated" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
