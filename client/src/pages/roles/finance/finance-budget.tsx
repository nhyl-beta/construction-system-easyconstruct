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
import { useBudgets } from "@/features/finance/budgets/hooks/useBudgets";
import { useBudgetAllocationController } from "@/features/finance/budgets/controllers/budget-allocation.controller.js";
import { formatCompactCurrency } from "@/lib/format-currency";

import {
  Banknote,
  GitBranch,
  Plus,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  BUDGET_CHART_COLORS,
  CHART_AXIS_STYLE,
  CHART_GRID_STYLE,
} from "@/features/finance/budgets/constants/chart-colors";

export default function FinanceBudget() {
  const c = useBudgets();

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
                    <Cell
                      key={entry.label}
                      fill={entry.color}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(v: number) =>
                    formatCompactCurrency(v)
                  }
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
                    style={{
                      backgroundColor: item.color,
                    }}
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
                <CartesianGrid
                  {...CHART_GRID_STYLE}
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  {...CHART_AXIS_STYLE}
                  tickFormatter={(v) =>
                    `$${(v / 1_000_000).toFixed(0)}M`
                  }
                />

                <YAxis
                  dataKey="label"
                  type="category"
                  {...CHART_AXIS_STYLE}
                  width={90}
                />

                <Tooltip
                  formatter={(v: number) =>
                    formatCompactCurrency(v)
                  }
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
              <TableHead className="text-right">
                Planned
              </TableHead>
              <TableHead className="text-right">
                Committed
              </TableHead>
              <TableHead className="text-right">
                Spent
              </TableHead>
              <TableHead className="w-40">
                Utilization
              </TableHead>
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

                  <TableCell className="font-medium">
                    {b.project}
                  </TableCell>

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
                      <Progress
                        value={pct}
                        className="h-1.5"
                      />

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
    </div>
  );
}

FinanceBudget.displayName = "FinanceBudget";