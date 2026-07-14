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
import { payrollRows } from "@/providers/mock-data";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  Wallet,
} from "lucide-react";

export default function HRPayrollPage() {
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
          value="$2.84M"
          tone="info"
          icon={Wallet}
        />
        <KpiMini
          label="Net payable"
          value="$2.28M"
          tone="success"
          icon={CheckCircle2}
        />
        <KpiMini
          label="Overtime cost"
          value="$184K"
          tone="warning"
          icon={Clock}
        />
        <KpiMini
          label="Awaiting approval"
          value="124"
          tone="warning"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payroll batch B-118</CardTitle>
            <p className="text-xs text-muted-foreground">
              Pay period Jun 1 – Jun 15 · 518 employees
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
                {payrollRows.map((p) => (
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
                $2,284,910
              </div>
              <div className="mt-2 text-[11px] text-success">
                +4.1% vs prev period
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Base wages", value: 78, amount: "$2.21M" },
                { label: "Overtime", value: 6, amount: "$184K" },
                { label: "Bonuses", value: 4, amount: "$112K" },
                { label: "Deductions", value: 12, amount: "$336K" },
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
