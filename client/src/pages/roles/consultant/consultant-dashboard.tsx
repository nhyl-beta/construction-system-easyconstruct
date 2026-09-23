import {
  Activity,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileSearch,
  FolderKanban,
  Sparkles,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";
import { FEATURES } from "@/config/features";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRoleConfig } from "@/hooks/use-role-config";
import { useConsultantDashboardController } from "@/features/dashboard/controllers/consultant-dashboard.controller";
import { useNavigate } from "react-router";

export default function ConsultantDashboardPage() {
  const { identity } = useRoleConfig();
  const navigate = useNavigate();
  const c = useConsultantDashboardController();

  const firstName = identity.name.split(" ")[0];

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      {/* ── Hero header ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary-soft/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary"
          >
            <Activity className="mr-1.5 h-3 w-3" />
            Advisory access
          </Badge>

          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back, {firstName}.
          </h2>

          <p className="max-w-xl text-sm text-muted-foreground">
            {c.loading
              ? "Loading your advisory queue…"
              : `${c.kpis.pendingReviews} proposal${
                  c.kpis.pendingReviews === 1 ? "" : "s"
                } awaiting your review across ${
                  c.kpis.activeProjects
                } active project${
                  c.kpis.activeProjects === 1 ? "" : "s"
                }.`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/advisory-docs")}
          >
            <Upload className="h-4 w-4" />
            Upload advisory
          </Button>

          <Button
            className="rounded-xl"
            onClick={() => navigate("/consultant/proposals")}
          >
            <FileSearch className="h-4 w-4" />
            Review proposals
          </Button>
        </div>
      </section>

      {/* ── KPI grid ── */}
      <KpiStrip
        items={[
          {
            label: "Pending proposal reviews",
            value: `${c.kpis.pendingReviews}`,
            icon: FileSearch,
            tone:
              c.kpis.pendingReviews > 0
                ? "warn"
                : "good",
          },
          {
            label: "Total proposals",
            value: `${c.kpis.totalProposals}`,
            icon: ClipboardList,
          },
          {
            label: "Active projects",
            value: `${c.kpis.activeProjects}`,
            icon: FolderKanban,
          },
          {
            label: "Advisory documents",
            value: `${c.kpis.advisoryDocuments}`,
            icon: FileCheck2,
          },
        ]}
      />

      {/* ── Main grid — proposal review queue + AI panel ── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">
                Awaiting your review
              </CardTitle>

              <p className="text-xs text-muted-foreground">
                {c.loading
                  ? "Loading…"
                  : `${c.proposalsAwaitingReview.length} proposal${
                      c.proposalsAwaitingReview.length === 1
                        ? ""
                        : "s"
                    } pending advisory review`}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground"
              onClick={() => navigate("/consultant/proposals")}
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {c.loading ? (
              <div className="p-5 text-sm text-muted-foreground">
                Loading proposals…
              </div>
            ) : c.proposalsAwaitingReview.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No proposals are currently awaiting your review.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border/70 bg-muted/40 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-2.5 font-medium">
                        Proposal
                      </th>

                      <th className="px-3 py-2.5 font-medium">
                        Project
                      </th>

                      <th className="px-3 py-2.5 font-medium">
                        Submitted by
                      </th>

                      <th className="px-5 py-2.5 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {c.proposalsAwaitingReview
                      .slice(0, 5)
                      .map(
                        (
                          p: (typeof c.proposalsAwaitingReview)[number],
                        ) => (
                          <tr
                            key={p.id}
                            className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/30"
                            onClick={() =>
                              navigate("/consultant/proposals")
                            }
                          >
                            <td className="px-5 py-3.5">
                              <div className="font-medium leading-tight">
                                {p.title}
                              </div>

                              <div className="font-mono text-xs text-muted-foreground">
                                {p.proposalId}
                              </div>
                            </td>

                            <td className="px-3 py-3.5 text-sm text-muted-foreground">
                              {p.projectCode}
                            </td>

                            <td className="px-3 py-3.5 text-xs text-muted-foreground">
                              {p.submittedBy}
                            </td>

                            <td className="px-5 py-3.5">
                              <StatusBadge status={p.status} />
                            </td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── AI Insights — hidden behind FEATURES.ai, see config/features.ts ── */}
        {FEATURES.ai && (
          <ComingSoonCard
            title="AI validation insights"
            description="Proposal-level AI validation summaries aren't wired to a backend yet. Once connected, this panel will surface findings, confidence, and recommendations — always labeled as advisory analysis requiring human review."
          />
        )}
      </section>

      {/* ── Bottom row — approvals + recently reviewed ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                Recently reviewed
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {c.loading ? (
                <div className="p-5 text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : c.recentlyReviewed.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No proposals have been reviewed yet.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {c.recentlyReviewed.map(
                    (
                      p: (typeof c.recentlyReviewed)[number],
                    ) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-5 py-3.5"
                      >
                        <div>
                          <div className="text-sm font-medium leading-tight">
                            {p.title}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {p.projectCode}
                          </div>
                        </div>

                        <StatusBadge status={p.status} />
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <ComingSoonCard
          title="Approval participation"
          description="No approvals backend exists yet — this will surface workflow approval requests requiring your advisory input once that module is built."
        />
      </section>

      {/* ── Footer status ── */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        Live advisory data
        {c.loading ? " · loading…" : ""}
      </div>
    </div>
  );
}

ConsultantDashboardPage.displayName =
  "ConsultantDashboardPage";