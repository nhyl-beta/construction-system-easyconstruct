import { PageHeader } from "@/components/refine-ui/views/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBudgetAllocationController } from "@/features/finance/budgets/controllers/budget-allocation.controller.js";
import { useBudgetAdjustments } from "@/features/finance/budgets/hooks/useBudgetAdjustments";
import { useBudgets } from "@/features/finance/budgets/hooks/useBudgets";
import { formatCompactCurrency } from "@/lib/format-currency";
import { useState } from "react";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  FileText,
  GitBranch,
  Plus,
  ScrollText,
  Search,
  Shuffle,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  BUDGET_CHART_COLORS,
  CHART_AXIS_STYLE,
  CHART_GRID_STYLE,
} from "@/features/finance/budgets/constants/chart-colors";
import type { AdjustmentKind } from "@/features/finance/budgets/types/budget-adjustment.types";

const kindIcon: Record<AdjustmentKind, typeof ArrowUpRight> = {
  increase: ArrowUpRight,
  decrease: ArrowDownRight,
  transfer: Shuffle,
  emergency: AlertTriangle,
};

const kindTone: Record<AdjustmentKind, string> = {
  increase: "text-destructive bg-destructive/10",
  decrease: "text-success bg-success/10",
  transfer: "text-primary bg-primary/10",
  emergency: "text-warning-foreground bg-warning/15",
};

import { ApprovalStepper } from "@/components/ui/approval-stepper";
import { ApprovalTimeline } from "@/components/ui/approval-timeline";
import { Textarea } from "@/components/ui/textarea";
import { useBudgetApproval } from "@/features/finance/budgets/hooks/useBudgetApproval";
import { Check, RotateCcw, X } from "lucide-react";
export default function FinanceBudget() {
  const [tab, setTab] = useState("overview");
  const c = useBudgets();
  const approval = useBudgetApproval(c.budgets);

  const allocation = useBudgetAllocationController(
    c.budgets.map((b) => ({
      id: b.id,
      budgetId: b.id,
      department: b.owner,
      category: b.category,
      amount: b.planned,
      consumed: b.spent,
      status: b.status,
      createdAt: b.createdAt,
    })),
  );

  const adjustments = useBudgetAdjustments();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader
        title="Budget Management"
        description="Manage project budgets, allocations, adjustments, and historical baselines across the portfolio."
        actions={
          <Button size="sm" className="rounded-xl">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Create budget
          </Button>
        }
      />

      <KpiStrip
        items={[
          {
            label: "Total planned",
            value: formatCompactCurrency(c.totals.planned),
            icon: Wallet,
          },
          {
            label: "Committed",
            value: formatCompactCurrency(c.totals.committed),
            icon: GitBranch,
          },
          {
            label: "Spent",
            value: formatCompactCurrency(c.totals.spent),
            icon: TrendingUp,
            tone: "warn",
          },
          {
            label: "Remaining",
            value: formatCompactCurrency(c.totals.remaining),
            icon: Banknote,
            tone: "good",
          },
        ]}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">
            Overview
          </TabsTrigger>
          <TabsTrigger value="allocation" className="rounded-lg">
            Allocation
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="rounded-lg">
            Adjustments
          </TabsTrigger>
          <TabsTrigger value="approval" className="rounded-lg">
            Approvals
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={c.query}
                onChange={(e) => c.setQuery(e.target.value)}
                placeholder="Search project, owner…"
                className="h-8 rounded-lg pl-8 text-xs"
              />
            </div>
            <Select value={c.fy} onValueChange={c.setFy}>
              <SelectTrigger className="h-8 w-28 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All FY</SelectItem>
                <SelectItem value="FY2026">FY2026</SelectItem>
                <SelectItem value="FY2025">FY2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {c.loading ? (
            <div className="text-sm text-muted-foreground">
              Loading budgets…
            </div>
          ) : c.budgets.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No budgets match your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Planned</TableHead>
                  <TableHead className="text-right">Committed</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="w-40">Utilization</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.budgets.map((b) => {
                  const pct = b.planned
                    ? Math.round((b.spent / b.planned) * 100)
                    : 0;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs">
                        {b.id}
                      </TableCell>
                      <TableCell className="font-medium">{b.project}</TableCell>
                      <TableCell>{b.category}</TableCell>
                      <TableCell>{b.owner}</TableCell>
                      <TableCell className="text-right">
                        {formatCompactCurrency(b.planned)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCompactCurrency(b.committed)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCompactCurrency(b.spent)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={pct} className="h-1.5" />
                          <div className="text-[10px] text-muted-foreground">
                            {pct}% used
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ── Allocation ────────────────────────────────────────────── */}
        <TabsContent value="allocation" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 p-5">
              <h3 className="mb-3 text-sm font-medium">
                Allocation by category
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation.byCategory}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {allocation.byCategory.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCompactCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-2">
                {allocation.byCategory.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">
                      {formatCompactCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 p-5">
              <h3 className="mb-3 text-sm font-medium">
                Allocation by department
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={allocation.byDepartment}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid {...CHART_GRID_STYLE} horizontal={false} />
                    <XAxis
                      type="number"
                      {...CHART_AXIS_STYLE}
                      tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
                    />
                    <YAxis
                      dataKey="label"
                      type="category"
                      {...CHART_AXIS_STYLE}
                      width={90}
                    />
                    <Tooltip
                      formatter={(v: number) => formatCompactCurrency(v)}
                    />
                    <Bar
                      dataKey="value"
                      fill={BUDGET_CHART_COLORS[1]}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Adjustments ───────────────────────────────────────────── */}
        <TabsContent value="adjustments" className="mt-4 space-y-4">
          <KpiStrip
            items={[
              {
                label: "Total requests",
                value: adjustments.totals.count.toString(),
                icon: ScrollText,
              },
              {
                label: "Pending",
                value: adjustments.totals.pending.toString(),
                icon: FileText,
                tone: "warn",
              },
              {
                label: "Increases",
                value: `+${formatCompactCurrency(
                  adjustments.totals.increases,
                )}`,
                icon: ArrowUpRight,
                tone: "bad",
              },
              {
                label: "Decreases",
                value: formatCompactCurrency(adjustments.totals.decreases),
                icon: ArrowDownRight,
                tone: "good",
              },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={adjustments.query}
                onChange={(e) => adjustments.setQuery(e.target.value)}
                placeholder="Search reason, requester…"
                className="h-8 rounded-lg pl-8 text-xs"
              />
            </div>
            <Select
              value={adjustments.kind}
              onValueChange={(v) =>
                adjustments.setKind(v as AdjustmentKind | "all")
              }
            >
              <SelectTrigger className="h-8 w-32 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All kinds</SelectItem>
                <SelectItem value="increase">Increase</SelectItem>
                <SelectItem value="decrease">Decrease</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={adjustments.status}
              onValueChange={adjustments.setStatus}
            >
              <SelectTrigger className="h-8 w-36 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending-review">Pending Review</SelectItem>
                <SelectItem value="finance-review">Finance Review</SelectItem>
                <SelectItem value="manager-review">Manager Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {adjustments.loading ? (
            <div className="text-sm text-muted-foreground">
              Loading adjustments…
            </div>
          ) : adjustments.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No adjustments match your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Δ</TableHead>
                  <TableHead className="text-right">New total</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.items.map((a) => {
                  const Icon = kindIcon[a.kind];
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">
                        {a.id}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                            kindTone[a.kind]
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {a.kind}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCompactCurrency(a.originalAmount)}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          a.adjustmentAmount > 0
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {a.adjustmentAmount > 0 ? "+" : ""}
                        {formatCompactCurrency(a.adjustmentAmount)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCompactCurrency(a.newAmount)}
                      </TableCell>
                      <TableCell className="max-w-[240px] text-xs text-muted-foreground">
                        {a.reason}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {a.requestedAt}
                        <div>{a.requestedBy}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ── Approvals ─────────────────────────────────────────────── */}
        <TabsContent value="approval" className="mt-4 space-y-4">
          <div className="rounded-2xl border border-border/70 p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Approval pipeline</h3>
              <Select
                value={approval.selectedBudgetId}
                onValueChange={approval.setSelectedBudgetId}
              >
                <SelectTrigger className="h-8 w-56 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {approval.budgets.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.id} · {b.project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {approval.loading ? (
              <div className="text-sm text-muted-foreground">
                Loading pipeline…
              </div>
            ) : (
              <ApprovalStepper
                current={approval.current}
                steps={approval.steps}
              />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 p-5 md:col-span-2">
              <h3 className="mb-3 text-sm font-medium">Approval timeline</h3>
              <ApprovalTimeline steps={approval.steps} />
            </div>

            <div className="rounded-2xl border border-border/70 p-5">
              <h3 className="mb-3 text-sm font-medium">Decision panel</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                    Comments
                  </label>
                  <Textarea
                    rows={5}
                    value={approval.comment}
                    onChange={(e) => approval.setComment(e.target.value)}
                    placeholder="Provide context for your decision…"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl bg-success text-success-foreground hover:bg-success/90"
                    disabled={
                      approval.submitting || approval.current === "approved"
                    }
                    onClick={() => approval.decide("approved")}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={approval.submitting}
                    onClick={() => approval.decide("returned")}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Return
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-destructive"
                    disabled={approval.submitting}
                    onClick={() => approval.decide("rejected")}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3 text-[11px] text-muted-foreground">
                  Every decision is signed, timestamped, and written to the
                  immutable audit log.
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

FinanceBudget.displayName = "FinanceBudget";
