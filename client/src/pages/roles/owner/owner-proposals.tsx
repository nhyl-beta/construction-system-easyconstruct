import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { Input } from "@/components/ui/input";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { ProposalsTable } from "@/features/proposals/components/ProposalsTable";
import { useProposals } from "@/features/proposals/hooks/useProposals";

// Owner had no view of the proposal register at all — this is new, not a
// re-styling. Read-only by construction: the executive sees what has been
// submitted and how it was decided, but reviewing is Consultant's job.
//
// Rows are ascending by submission order. The API now sorts explicitly
// (server/src/proposals/repository.ts) — previously there was no ORDER BY at
// all, so Postgres was free to return rows in any order and the table
// reshuffled between loads.
export default function OwnerProposals() {
  const { proposals, loading, error, kpis } = useProposals();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const rows = search
      ? proposals.filter((p) => {
          const term = search.toLowerCase();
          return (
            p.title.toLowerCase().includes(term) ||
            p.proposalId.toLowerCase().includes(term) ||
            p.projectCode.toLowerCase().includes(term)
          );
        })
      : proposals;

    // Re-asserted client-side so the order holds even if this list is later
    // fed from a cache or a differently-sorted endpoint.
    return [...rows].sort((a, b) => a.id - b.id);
  }, [proposals, search]);

  return (
    <PageContainer>
      <PageHeader
        title="Proposals"
        description="Every design proposal submitted across the organization, oldest first."
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <KpiStrip
          items={[
            { label: "Total proposals", value: `${kpis.total}`, icon: FileText },
            { label: "Pending review", value: `${kpis.pending}`, icon: FileText, tone: kpis.pending > 0 ? "warn" : "neutral" },
            { label: "Approved", value: `${kpis.approved}`, icon: FileText, tone: "good" },
            { label: "Revision requested", value: `${kpis.revisionRequested}`, icon: FileText, tone: kpis.revisionRequested > 0 ? "warn" : "neutral" },
          ]}
        />

        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposals…"
            className="h-8 rounded-lg pl-8 text-xs"
          />
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading proposals…</p>}
        {!loading && error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Couldn't load proposals. {error}
          </p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 px-6 py-12 text-center">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {proposals.length === 0
                ? "No proposals submitted yet."
                : "No proposals match your search."}
            </p>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <ProposalsTable proposals={filtered} />
        )}
      </PageContent>
    </PageContainer>
  );
}

OwnerProposals.displayName = "OwnerProposals";
