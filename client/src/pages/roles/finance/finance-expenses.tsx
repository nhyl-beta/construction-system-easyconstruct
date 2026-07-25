// client/src/pages/finance/finance-expenses.tsx
import { useState } from "react";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Receipt, Search, Plus, Truck, Wallet, ListChecks, Sparkles, Paperclip } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { useExpensesController } from "@/features/finance/hooks/use-expenses";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export default function FinanceExpensesPage() {
  const c = useExpensesController();
  const [active, setActive] = useState("tracking");

  return (
    <PageContainer>
      <PageHeader
        title="Expense Management"
        description="Track operational expenses, purchase requests, vendor payments, reimbursements and AI anomaly detection."
        actions={
          <Button size="sm" className="rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Record expense
          </Button>
        }
      />

      <PageContent className="space-y-6 p-4 md:p-8">
        {c.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Failed to load expenses: {c.error}
          </div>
        )}

        <KpiStrip
          items={[
            { label: "MTD spend", value: formatCurrency(c.expenses.reduce((s, e) => s + e.amount, 0)), icon: Receipt },
            { label: "Open requests", value: `${c.purchaseRequests.length}`, icon: ListChecks, tone: "warn" },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { label: "Reimbursements", value: formatCurrency(c.reimbursements.reduce((s: number, r: any) => s + r.amount, 0)), icon: Wallet },
            { label: "Procurement in transit", value: `${c.procurement.length}`, icon: Truck },
          ]}
        />

        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="tracking" className="rounded-lg">Tracking</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg">Purchase Requests</TabsTrigger>
            <TabsTrigger value="reimbursements" className="rounded-lg">Reimbursements</TabsTrigger>
            <TabsTrigger value="procurement" className="rounded-lg">Procurement</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="mt-4">
            <SectionCard
              title="Expense ledger"
              subtitle="All vendor expenses across active projects"
              actions={
                <>
                  <div className="relative w-56">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={c.query}
                      onChange={(e) => c.setQuery(e.target.value)}
                      placeholder="Search vendor, ID, project…"
                      className="h-8 rounded-lg pl-8 text-xs"
                    />
                  </div>
                  <Select value={c.category} onValueChange={c.setCategory}>
                    <SelectTrigger className="h-8 w-36 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="Materials">Materials</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="PPE">PPE</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            >
              {c.isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
                  ))}
                </div>
              ) : c.expenses.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No expenses match your filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>AI</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.id}</TableCell>
                        <TableCell className="text-sm font-medium">{e.vendor}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.project}</TableCell>
                        <TableCell className="text-xs">{e.category}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(e.amount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.submittedAt}</TableCell>
                        <TableCell>
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          {e.anomalyScore !== null && (
                            <Badge
                              variant="outline"
                              className={`rounded-full text-[10px] ${
                                e.anomalyScore > 0.6
                                  ? "border-destructive/30 text-destructive bg-destructive/10"
                                  : e.anomalyScore > 0.3
                                    ? "border-warning/30 text-warning-foreground bg-warning/10"
                                    : "border-success/30 text-success bg-success/10"
                              }`}
                            >
                              {(e.anomalyScore * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell><StatusBadge status={e.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Spending by category" subtitle="Current cycle">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={c.breakdown}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(Number(v))} />
                      <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
              <SectionCard title="AI anomaly detection" subtitle="Outliers worth investigating">
                <ul className="space-y-2">
                  {c.expenses
                    .filter((e) => (e.anomalyScore ?? 0) >= 0.4)
                    .map((e) => (
                      <li key={e.id} className="rounded-xl border bg-warning/5 p-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Sparkles className="h-3 w-3 text-warning-foreground" />
                          <span className="font-mono">{e.id}</span>
                          <span>·</span>
                          <span className="font-medium">{e.vendor}</span>
                          <span className="ml-auto font-semibold">{((e.anomalyScore ?? 0) * 100).toFixed(0)}%</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatCurrency(e.amount)} · {e.category} · {e.project}
                        </p>
                      </li>
                    ))}
                </ul>
              </SectionCard>
            </div>
          </TabsContent>

          {/* requests / reimbursements / procurement tabs: wire up once
              use-expenses.ts's stubbed purchaseRequests/reimbursements/procurement
              arrays are backed by their own fetch calls (Phase 2 backend modules) */}
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}

FinanceExpensesPage.displayName = "FinanceExpensesPage";