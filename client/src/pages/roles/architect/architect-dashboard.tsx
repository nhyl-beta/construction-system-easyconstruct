import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useArchitectDashboardController } from "@/features/dashboard/controllers/architect-dashboard.controller";
import { WaitingOnYouCard } from "@/features/lifecycle/components/WaitingOnYouCard";
import { useAuth } from "@/auth/auth-context";
import { useDesignReviews } from "@/features/design-reviews/hooks/useDesignReviews";
import {
  CheckSquare,
  Eye,
  FileText,
  MessageSquare,
  PencilRuler,
  Plus,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function ArchitectDashboard() {
  const navigate = useNavigate();
  const c = useArchitectDashboardController();
  const { user } = useAuth();
  const { create } = useDesignReviews();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitReviewRequest = async () => {
    if (!selectedDesignId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const design = c.recentDesigns.find((d) => String(d.id) === selectedDesignId);
      await create({
        code: `REV-${(design?.code ?? selectedDesignId)}-${Date.now().toString(36).toUpperCase()}`.slice(0, 20),
        designId: Number(selectedDesignId),
        requestedBy: user?.name ?? "Architect",
      });
      setReviewDialogOpen(false);
      setSelectedDesignId("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to request review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader
        title="Design Studio"
        description="Your workspace for designs, proposals, and review activity."
        actions={
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => navigate("/designs/new")}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            New design
          </Button>
        }
      />

      <KpiStrip
        items={[
          {
            label: "Total designs",
            value: `${c.kpis.total}`,
            icon: PencilRuler,
          },
          {
            label: "In review",
            value: `${c.kpis.inReview}`,
            icon: CheckSquare,
            tone: "warn",
          },
          {
            label: "Approved",
            value: `${c.kpis.approved}`,
            icon: CheckSquare,
            tone: "good",
          },
          {
            label: "Pending proposals",
            value: `${c.proposalKpis.pending}`,
            icon: FileText,
            tone: "warn",
          },
        ]}
      />

      {/* K1: cross-project gate checks + workflow stages waiting on this architect */}
      <WaitingOnYouCard />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Active designs"
          subtitle="Most recently updated"
          className="lg:col-span-2"
        >
          {c.loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : c.recentDesigns.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No designs yet.
            </div>
          ) : (
            <div className="space-y-2">
              {c.recentDesigns.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/designs/${d.id}`)}
                  className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-muted/30"
                >
                  <div>
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {d.code} · rev {d.revision}
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Quick actions">
          <div className="space-y-2">
            <QuickAction
              icon={Upload}
              label="Upload drawing"
              description="Add a new DWG or PDF revision"
              onClick={() => navigate("/designs/new")}
            />
            {/* Part C2: was hardcoded `disabled` even though POST
                /design-reviews (server/src/designs/design-reviews/service.ts
                create()) already works — a real design review is created
                and shown to Consultant on /consultant/design-reviews. */}
            <QuickAction
              icon={Eye}
              label="Request review"
              description="Send a design to consultants"
              onClick={() => setReviewDialogOpen(true)}
            />
            {/* Part C2: confirmed (grepped server/src) there is no general
                discussion-thread table anywhere — only per-decision comment
                fields on design reviews/workflow stages, never a standing
                thread. Left disabled, relabeled to read as "not built"
                rather than ambiguous. */}
            <QuickAction
              icon={MessageSquare}
              label="Comment thread"
              description="Not built yet — no discussion-thread table exists"
              disabled
            />
            {/* Part C2: "Generate options / AI design variations" was a
                fake-AI placeholder, never part of the real AI-validation
                scope (proposal checks / cost-comparison / the five signal
                rules) — removed outright, not wired up, same standard as
                FEATURES.aiPlaceholders' surface table. */}
          </div>
        </SectionCard>
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a design review</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="review-design">Design</Label>
            <Select value={selectedDesignId} onValueChange={setSelectedDesignId}>
              <SelectTrigger id="review-design">
                <SelectValue placeholder="Pick a design to send" />
              </SelectTrigger>
              <SelectContent>
                {c.recentDesigns.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name} · {d.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={submitReviewRequest}
              disabled={!selectedDesignId || submitting}
            >
              {submitting ? "Sending…" : "Send for review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionCard
        title="Coming soon"
        subtitle="Not yet built — placeholders only"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ComingSoonCard
            title="Blueprint library"
            description="Enterprise drawing library with folders and version history."
          />
          <ComingSoonCard
            title="Review queue"
            description="Track design reviews awaiting response."
          />
          <ComingSoonCard
            title="Revision tracker"
            description="Side-by-side comparison of design revisions."
          />
          <ComingSoonCard
            title="Documentation hub"
            description="Specifications, permits, and as-built docs."
          />
        </div>
      </SectionCard>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  disabled,
}: {
  icon: typeof Upload;
  label: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border bg-background p-3 text-left text-sm transition enabled:hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

ArchitectDashboard.displayName = "ArchitectDashboard";
