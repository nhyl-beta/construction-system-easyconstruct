import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/auth/auth-context";
import { ProposalsTable } from "@/features/proposals/components/ProposalsTable";
import {
  PROPOSAL_DECISIONS,
  findProposalDecision,
  type ProposalDecision,
} from "@/features/proposals/lib/proposal-decisions";
import { useProposals } from "@/features/proposals/hooks/useProposals";
import type { Proposal } from "@/features/proposals/types/proposal.types";

// IT Designer had no proposals screen — this is new work, not a CSS fix.
// It is an oversight view over the same register Consultant reviews, with the
// same shared table (word-wrapped, so long titles and review comments stay
// readable) and the same confirmed decision flow, so a stuck proposal can be
// unblocked without a second, divergent review implementation.
export default function ITDesignerProposals() {
  const { proposals, loading, saving, error, kpis, reviewProposal } = useProposals();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [comment, setComment] = useState("");
  const [pendingDecision, setPendingDecision] = useState<ProposalDecision | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

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
    return [...rows].sort((a, b) => a.id - b.id);
  }, [proposals, search]);

  const submitDecision = async (decision: ProposalDecision) => {
    if (!selected) return;
    if (!comment.trim()) {
      setLocalError("Enter a review comment before submitting a decision.");
      return;
    }
    setLocalError(null);
    const updated = await reviewProposal(selected.id, {
      status: decision,
      reviewerName: user?.name,
      reviewComment: comment.trim(),
    });
    if (updated) {
      setSelected(null);
      setComment("");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Proposals"
        description="System-wide oversight of the proposal register, with review access for unblocking stalled submissions."
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
          <ProposalsTable
            proposals={filtered}
            selectedId={selected?.id ?? null}
            onSelect={(p) => {
              setSelected(p);
              setComment(p.reviewComment ?? "");
              setLocalError(null);
            }}
          />
        )}

        {selected && (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold">Review {selected.proposalId}</h3>
              <p className="mt-0.5 whitespace-normal break-words text-xs text-muted-foreground">
                {selected.title}
              </p>
            </div>

            {localError && (
              <p role="alert" className="text-sm text-destructive">{localError}</p>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="it-review-comment">Review comment</Label>
              <Textarea
                id="it-review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Explain what should be approved, revised, or rejected."
                className="min-h-28 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {PROPOSAL_DECISIONS.map((decision) => {
                const Icon = decision.icon;
                return (
                  <Button
                    key={decision.status}
                    type="button"
                    variant={decision.variant}
                    disabled={saving}
                    onClick={() => setPendingDecision(decision.status)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {decision.label}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setSelected(null);
                  setComment("");
                  setLocalError(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </PageContent>

      <ConfirmDialog
        open={pendingDecision !== null}
        onOpenChange={(open) => !open && setPendingDecision(null)}
        title={
          pendingDecision
            ? findProposalDecision(pendingDecision)?.confirmTitle ?? "Submit review?"
            : ""
        }
        description={
          pendingDecision
            ? findProposalDecision(pendingDecision)?.confirmDescription
            : undefined
        }
        confirmLabel={
          pendingDecision
            ? findProposalDecision(pendingDecision)?.label ?? "Confirm"
            : "Confirm"
        }
        destructive={
          pendingDecision
            ? findProposalDecision(pendingDecision)?.destructive ?? false
            : false
        }
        loading={saving}
        onConfirm={() => {
          if (!pendingDecision) return;
          const decision = pendingDecision;
          setPendingDecision(null);
          void submitDecision(decision);
        }}
      />
    </PageContainer>
  );
}

ITDesignerProposals.displayName = "ITDesignerProposals";
