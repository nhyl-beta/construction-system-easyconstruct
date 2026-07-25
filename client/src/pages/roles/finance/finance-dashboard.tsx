import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinanceDashboardController } from "@/features/finance/hooks/use-finance-dashboard";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from "@/lib/format-currency";
import {
  Activity,
  AlertTriangle,
  Banknote,
  ClipboardList,
  FileWarning,
  PieChart as PieIcon,
  Plus,
  Receipt,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
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

const allocationColors = [
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
];

export default function FinanceDashboardPage() {
  const c = useFinanceDashboardController();

  const allocation = c.budgets.map((b) => ({
    name: b.project,
    value: b.planned,
  }));
  const expensesByCategory = (() => {
    const map = new Map<string, number>();
    c.expenses.forEach((e) =>
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount),
    );
    return Array.from(map, ([name, value]) => ({ name, value }));
  })();

  return (
    <PageContainer>
      <PageHeader
        title="Finance Dashboard"
        description="Live view of budgets, cash flow, payroll review queue, and AI-generated financial intelligence across the portfolio."
        actions={
          <Button size="sm" className="rounded-xl">
            <Plus className="h-3.5 w-3.5" /> New transaction
          </Button>
        }
      />

      <PageContent className="space-y-6 p-4 md:p-8">
        {c.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Failed to load finance data: {c.error}
          </div>
        )}

        {c.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <KpiStrip
            items={[
              {
                label: "Total budget",
                value: formatCompactCurrency(c.kpis.totalBudget),
                hint: `Across ${c.budgets.length} projects`,
                icon: Wallet,
              },
              {
                label: "Utilization",
                value: formatPercent(c.kpis.utilizationPct),
                hint: "Spent / planned",
                icon: PieIcon,
                tone: c.kpis.utilizationPct > 0.85 ? "warn" : "good",
              },
              {
                label: "Remaining",
                value: formatCompactCurrency(c.kpis.remainingBudget),
                hint: "Available headroom",
                icon: Banknote,
                tone: "good",
              },
              {
                label: "Monthly expenses",
                value: formatCurrency(c.kpis.monthlyExpenses),
                hint: "Current month",
                icon: Receipt,
              },
              {
                label: "Pending payroll",
                value: `${c.kpis.pendingPayrollReviews}`,
                hint: "Batches awaiting review",
                icon: ClipboardList,
                tone: "warn",
              },
              {
                label: "Outstanding invoices",
                value: formatCurrency(c.kpis.outstandingInvoices),
                hint: "Open + overdue",
                icon: FileWarning,
                tone: "warn",
              },
              {
                label: "Cash flow (net)",
                value: formatCurrency(c.kpis.cashFlowNet),
                hint: "Latest month",
                icon: Activity,
                tone: c.kpis.cashFlowNet >= 0 ? "good" : "bad",
              },
              {
                label: "Profit margin",
                value: formatPercent(c.kpis.profitMargin),
                hint: "Portfolio rolling",
                icon: TrendingUp,
                tone: "good",
              },
            ]}
          />
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionCard
                title="Budget allocation"
                subtitle="Planned distribution by project"
                badge="Live"
              >
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocation}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {allocation.map((_, i) => (
                          <Cell
                            key={i}
                            fill={allocationColors[i % allocationColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) =>
                          formatCompactCurrency(Number(v))
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                  {allocation.map((a, i) => (
                    <div key={a.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            allocationColors[i % allocationColors.length],
                        }}
                      />
                      <span className="truncate">{a.name}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Expense distribution"
                subtitle="Spend by category, current cycle"
                badge="MTD"
              >
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesByCategory}>
                      <CartesianGrid
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.4}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v: number) => formatCurrency(Number(v))}
                      />
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title="Cash flow trend"
              subtitle="Inflow vs outflow ($M)"
              badge="6 months"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={c.cashFlow}>
                    <defs>
                      <linearGradient id="in" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="out" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#f43f5e"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f43f5e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.4}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `$${v}M`}
                    />
                    <Tooltip formatter={(v: number) => `$${v}M`} />
                    <Area
                      type="monotone"
                      dataKey="inflow"
                      stroke="#10b981"
                      fill="url(#in)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="outflow"
                      stroke="#f43f5e"
                      fill="url(#out)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              title="Project profitability"
              subtitle="Revenue, cost and margin by project"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.projectProfit.map((p) => (
                    <TableRow key={p.project}>
                      <TableCell className="text-sm font-medium">
                        {p.project}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCompactCurrency(p.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCompactCurrency(p.cost)}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          p.margin >= 0.15
                            ? "text-success"
                            : p.margin >= 0.1
                            ? "text-warning-foreground"
                            : "text-destructive"
                        }`}
                      >
                        {formatPercent(p.margin)}
                      </TableCell>
                      <TableCell className="w-40">
                        <Progress
                          value={Math.min(100, p.margin * 400)}
                          className="h-1.5"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard
              title="Pending approvals"
              subtitle="Awaiting your sign-off"
              badge={`${c.approvals.length}`}
            >
              <ul className="space-y-2 text-sm">
                {c.approvals.slice(0, 5).map((a) => (
                  <li key={a.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.kind}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {a.id}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.reference}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span>{formatCurrency(a.amount)}</span>
                      <span className="text-muted-foreground">
                        SLA · {a.slaHours}h
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              title="Financial risks"
              subtitle="AI-detected"
              badge="Live"
            >
              <ul className="space-y-2">
                {c.risks.map((r) => {
                  const tone =
                    r.level === "critical"
                      ? "text-destructive"
                      : r.level === "high"
                      ? "text-warning-foreground"
                      : r.level === "medium"
                      ? "text-warning-foreground"
                      : "text-success";
                  return (
                    <li
                      key={r.id}
                      className="flex items-start gap-2 rounded-xl border p-3 text-sm"
                    >
                      <ShieldAlert className={`mt-0.5 h-4 w-4 ${tone}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold">{r.title}</div>
                        <p className="text-[11px] text-muted-foreground">
                          {r.impact} · {r.project}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>

            <SectionCard
              title="AI financial insights"
              subtitle="Top recommendations"
              badge="Advisor"
            >
              <ul className="space-y-3">
                {c.insights.slice(0, 3).map((i) => (
                  <li key={i.id} className="rounded-xl border bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-primary">
                      <Sparkles className="h-3 w-3" />
                      {i.category} · {(i.confidence * 100).toFixed(0)}%
                      confidence
                    </div>
                    <div className="mt-1 text-xs font-semibold">{i.title}</div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {i.body}
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Recent transactions">
              <ul className="space-y-1.5 text-xs">
                {c.expenses.slice(0, 5).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{e.vendor}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {e.project} · {e.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs">
                        {formatCurrency(e.amount)}
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>

        <Card className="rounded-2xl border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning-foreground" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                AI advisor disclosure.
              </span>{" "}
              Financial intelligence suggestions are advisory only. Approvals,
              disbursements and budget changes always require a human reviewer.
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}

FinanceDashboardPage.displayName = "FinanceDashboardPage";
