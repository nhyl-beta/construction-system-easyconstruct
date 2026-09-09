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
import { usePayroll } from "@/features/hr/hooks/use-hr";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function HRPayrollPage() {
  const [period, setPeriod] = useState("");
  const { payroll, loading, error, refresh, generate } = usePayroll(period || undefined);
  const [periodStart, periodEnd] = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
  }, []);
  const [start, setStart] = useState(periodStart);
  const [end, setEnd] = useState(periodEnd);
  const [generating, setGenerating] = useState(false);
  const generateBatch = async () => {
    setGenerating(true);
    try {
      const result = await generate({ periodStart: start, periodEnd: end });
      setPeriod(result.period ?? "");
      await refresh();
    } catch (generateError) {
      window.alert(generateError instanceof Error ? generateError.message : "Failed to generate payroll.");
    } finally {
      setGenerating(false);
    }
  };
  const rows = payroll?.rows ?? [];
  const totals = payroll?.totals ?? { grossLabor: 0, deductions: 0, netPayable: 0, overtimeHours: 0 };
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
          value={`$${totals.grossLabor.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          tone="info"
          icon={Wallet}
        />
        <KpiMini
          label="Net payable"
          value={`$${totals.netPayable.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          tone="success"
          icon={CheckCircle2}
        />
        <KpiMini
          label="Overtime cost"
          value={`$${totals.overtimeHours.toLocaleString()}h`}
          tone="warning"
          icon={Clock}
        />
        <KpiMini
          label="Awaiting approval"
          value={String(rows.filter((row) => row.status === "Pending").length)}
          tone="warning"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payroll batch B-118</CardTitle>
            <p className="text-xs text-muted-foreground">
                {period || "Generate a period from attendance"} · {rows.length} employees
            </p>
            <div className="flex flex-wrap items-end gap-2 pt-3">
              <label className="text-xs text-muted-foreground">Start<input type="date" value={start} onChange={(event) => setStart(event.target.value)} className="ml-2 h-8 rounded-lg border bg-background px-2 text-xs" /></label>
              <label className="text-xs text-muted-foreground">End<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="ml-2 h-8 rounded-lg border bg-background px-2 text-xs" /></label>
              <Button size="sm" className="rounded-xl" onClick={generateBatch} disabled={generating}>
                {generating ? "Generating…" : "Generate payroll"}
              </Button>
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
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Loading payroll…</TableCell></TableRow>}
                {error && !loading && <TableRow><TableCell colSpan={8} className="py-8 text-center text-destructive">{error}</TableCell></TableRow>}
                {!loading && !error && rows.map((p) => (
                  <TableRow key={p.empId} className="hover:bg-muted/40">
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
                      ${Number(p.gross).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      −${Number(p.deductions).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      ${Number(p.net).toLocaleString()}
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
                ${totals.netPayable.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Based on generated payroll rows
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Gross labor", value: totals.grossLabor ? 100 : 0, amount: `$${totals.grossLabor.toLocaleString()}` },
                { label: "Overtime hours", value: totals.overtimeHours ? 100 : 0, amount: `${totals.overtimeHours}h` },
                { label: "Deductions", value: totals.grossLabor ? Math.round((totals.deductions / totals.grossLabor) * 100) : 0, amount: `$${totals.deductions.toLocaleString()}` },
                { label: "Net payable", value: totals.grossLabor ? Math.round((totals.netPayable / totals.grossLabor) * 100) : 0, amount: `$${totals.netPayable.toLocaleString()}` },
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
              <Checkpoint label="Gross labor verified" done />
              <Checkpoint label="Manager approvals" />
              <Checkpoint label="Disbursement initiated" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
