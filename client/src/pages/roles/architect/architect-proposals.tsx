import { PageHeader } from "@/components/refine-ui/views/page-header";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, Search, Clock } from "lucide-react";
import { useProposals } from "@/features/proposals/hooks/useProposals";

export default function ArchitectProposals() {
  const c = useProposals();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader
        title="Proposals"
        description="Design proposals submitted against active projects."
      />

      <KpiStrip
        items={[
          { label: "Total proposals", value: `${c.kpis.total}`, icon: FileText },
          { label: "Pending", value: `${c.kpis.pending}`, icon: Clock, tone: "warn" },
        ]}
      />

      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={c.query}
          onChange={(e) => c.setQuery(e.target.value)}
          placeholder="Search proposals…"
          className="h-8 rounded-lg pl-8 text-xs"
        />
      </div>

      {c.loading ? (
        <div className="text-sm text-muted-foreground">Loading proposals…</div>
      ) : c.proposals.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No proposals match your filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Submitted by</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.proposals.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.proposalId}</TableCell>
                <TableCell className="text-sm font-medium">{p.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.projectCode}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.submittedBy}</TableCell>
                <TableCell className="text-right text-sm">{p.amount ?? "—"}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

ArchitectProposals.displayName = "ArchitectProposals";