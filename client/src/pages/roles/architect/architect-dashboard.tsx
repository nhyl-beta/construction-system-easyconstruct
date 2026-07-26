import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { Button } from "@/components/ui/button";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useArchitectDashboardController } from "@/features/dashboard/controllers/architect-dashboard.controller";
import {
  CheckSquare,
  Eye,
  FileText,
  MessageSquare,
  PencilRuler,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function ArchitectDashboard() {
  const navigate = useNavigate();
  const c = useArchitectDashboardController();

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
            <QuickAction
              icon={Eye}
              label="Request review"
              description="Send a design to consultants"
              disabled
            />
            <QuickAction
              icon={MessageSquare}
              label="Comment thread"
              description="Open active review discussions"
              disabled
            />
            <QuickAction
              icon={Sparkles}
              label="Generate options"
              description="AI design variations"
              disabled
            />
          </div>
        </SectionCard>
      </div>

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
