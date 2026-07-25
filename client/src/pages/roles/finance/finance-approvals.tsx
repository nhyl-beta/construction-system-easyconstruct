import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { useFinanceApprovalsController } from "@/features/finance/hooks/use-financial-approvals";

export default function FinanceApprovalsPage() {
  const c = useFinanceApprovalsController();

  return (
    <PageContainer>
      <PageHeader
        title="Financial Approvals"
        description="Centralized approval queue for budgets, payroll, expenses, procurement and invoices."
      />
      <PageContent className="space-y-6 p-4 md:p-8">
        {c.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Failed to load approvals: {c.error}
          </div>
        )}

        <SectionCard
          title="Approval queue"
          subtitle={`${c.approvals.length} items awaiting decision`}
          badge="Live"
        >
          {c.isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : c.approvals.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nothing waiting on your approval right now.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.approvals.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="text-sm font-medium">{a.kind}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.reference}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.requestedBy}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(a.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.slaHours}h</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => c.approve(a.id)}>
                          <Check className="h-3.5 w-3.5 text-success" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => c.reject(a.id)}>
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </PageContent>
    </PageContainer>
  );
}

FinanceApprovalsPage.displayName = "FinanceApprovalsPage";