import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  ListChecks,
  TrendingUp,
} from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { Progress } from "@/components/ui/progress";

import { useEngineerDashboardController } from "@/features/dashboard/controllers/engineer-dashboard.controller";
import { ReportStatusBadge } from "@/pages/roles/shared/shared-engineer";
import { useAuth } from "@/auth/auth-context";

export default function EngineerDashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.name ?? "Engineer").split(" ")[0];
  const c = useEngineerDashboardController();

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={
          c.loading
            ? "Loading your workspace…"
            : `${c.assignedProjectCount} assigned project${c.assignedProjectCount === 1 ? "" : "s"} · ${c.reports.criticalIssues} critical issue${c.reports.criticalIssues === 1 ? "" : "s"} open`
        }
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <KpiStrip
          items={[
            {
              label: "Assigned projects",
              value: c.loading ? "…" : `${c.assignedProjectCount}`,
              icon: FolderKanban,
              hint: "under your name",
            },
            {
              label: "Site reports",
              value: c.loading ? "…" : `${c.reports.progressCount}`,
              icon: ClipboardList,
              hint: "progress & inspections",
            },
            {
              label: "Critical issues",
              value: c.loading ? "…" : `${c.reports.criticalIssues}`,
              icon: AlertTriangle,
              tone: c.reports.criticalIssues > 0 ? "bad" : "neutral",
              hint: `${c.reports.issueCount} open total`,
            },
            {
              label: "Requirements pending",
              value: c.loading ? "…" : `${c.requirements.pending}`,
              icon: ListChecks,
              tone: c.requirements.pending > 0 ? "warn" : "neutral",
              hint: `${c.requirements.total} on file`,
            },
          ]}
        />

        {/* Issue + progress analytics, from /api/issues and the engineer's
            own assigned projects — no new backend endpoint needed. */}
        <KpiStrip
          items={[
            {
              label: "Open issues",
              value: c.loading ? "…" : `${c.issues.open}`,
              icon: AlertTriangle,
              tone: c.issues.open > 0 ? "bad" : "good",
              hint: `${c.issues.underReview} under review`,
            },
            {
              label: "Issue resolution rate",
              value: c.loading ? "…" : `${c.issues.resolutionRate}%`,
              icon: CheckCircle2,
              tone:
                c.issues.resolutionRate >= 80
                  ? "good"
                  : c.issues.resolutionRate >= 50
                  ? "warn"
                  : "bad",
              hint: `${c.issues.resolved} of ${c.issues.total} resolved`,
            },
            {
              label: "Average progress",
              value: c.loading ? "…" : `${c.averageProgress}%`,
              icon: TrendingUp,
              hint: "across your projects",
            },
            {
              label: "Issues reported",
              value: c.loading ? "…" : `${c.issues.total}`,
              icon: ListChecks,
              hint: "on your projects",
            },
          ]}
        />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Assigned projects */}
          <Card className="rounded-2xl border-border/70 shadow-sm xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your assigned projects</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {c.loading ? (
                <div className="p-5 text-sm text-muted-foreground">Loading projects…</div>
              ) : c.assignedProjects.length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  No projects are assigned to you yet — check with your PM.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {c.assignedProjects.map((p) => (
                    <div key={p.code} className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.code} · PM {p.pm}
                        </div>
                      </div>
                      <div className="flex w-32 items-center gap-2">
                        <Progress value={p.progress} className="h-1.5" />
                        <span className="w-9 text-xs tabular-nums text-muted-foreground">
                          {p.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent reports */}
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent reports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {c.loading ? (
                <div className="p-5 text-sm text-muted-foreground">Loading…</div>
              ) : c.reports.recent.length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">No reports filed yet.</div>
              ) : (
                <div className="divide-y divide-border/60">
                  {c.reports.recent.map((r) => (
                    <div key={r.id} className="space-y-1 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium">{r.title}</span>
                        <ReportStatusBadge status={r.status} />
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.id} · {r.project} · {r.updatedAgo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </PageContent>
    </PageContainer>
  );
}

EngineerDashboardPage.displayName = "EngineerDashboardPage";