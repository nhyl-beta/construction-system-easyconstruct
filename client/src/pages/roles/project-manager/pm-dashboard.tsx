import {
  Activity,
  Banknote,
  ChevronRight,
  FileCheck2,
  FolderKanban,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { Progress } from "@/components/ui/progress";
import { useRoleConfig } from "@/hooks/use-role-config";
import { usePmDashboardController } from "@/features/dashboard/controllers/pm-dashboard.controller";
import { useNavigate } from "react-router";

// ── Badge tone map (kept for risk labels, which are still free-text) ─────────

const riskToneClasses: Record<string, string> = {
  high: "text-destructive font-medium",
  medium: "text-warning-foreground font-medium",
  low: "text-muted-foreground",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { identity } = useRoleConfig();
  const navigate = useNavigate();
  const c = usePmDashboardController();
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
            Live data
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Good morning, {firstName}.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {c.loading
              ? "Loading your portfolio…"
              : `${c.totalProjectCount} project${c.totalProjectCount === 1 ? "" : "s"} in your portfolio. ${c.riskBreakdown.high} at high risk, ${c.overBudget} over budget.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/projects")}
          >
            <FolderKanban className="h-4 w-4" />
            All projects
          </Button>
        </div>
      </section>

      {/* ── KPI grid — real, from /api/projects ── */}
      <KpiStrip
        items={[
          { label: "Total projects", value: `${c.kpis.total}`, icon: FolderKanban },
          { label: "On track", value: `${c.kpis.onTrack}`, icon: Activity, tone: "good" },
          { label: "At risk", value: `${c.kpis.atRisk}`, icon: ShieldAlert, tone: "warn" },
          { label: "Over budget", value: `${c.overBudget}`, icon: Banknote, tone: c.overBudget > 0 ? "bad" : "neutral" },
        ]}
      />

      {/* ── Main grid — projects table + not-yet-connected AI panel ── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Projects table — real */}
        <Card className="rounded-2xl border-border/70 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Needs attention</CardTitle>
              <p className="text-xs text-muted-foreground">
                {c.loading
                  ? "Loading…"
                  : `${Math.min(5, c.totalProjectCount)} of ${c.totalProjectCount} — sorted by risk and budget overrun`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground"
              onClick={() => navigate("/projects")}
            >
              View all <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {c.loading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading projects…</div>
            ) : c.error ? (
              <div className="p-5 text-sm text-destructive">
                Couldn't load projects. {c.error.message}
              </div>
            ) : c.topProjects.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No projects yet.{" "}
                <button
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={() => navigate("/projects")}
                >
                  Create one
                </button>
                .
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border/70 bg-muted/40 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-2.5 font-medium">Project</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Progress</th>
                      <th className="px-3 py-2.5 font-medium">Budget</th>
                      <th className="px-3 py-2.5 font-medium">Due</th>
                      <th className="px-5 py-2.5 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.topProjects.map((p) => (
                      <tr
                        key={p.code}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/30"
                        onClick={() => navigate("/projects")}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium leading-tight">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.code}</div>
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <Progress value={p.progress} className="h-1.5 w-24" />
                            <span className="w-9 text-xs tabular-nums text-muted-foreground">
                              {p.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={
                              p.budget > 100
                                ? "text-sm font-medium tabular-nums text-destructive"
                                : "text-sm tabular-nums"
                            }
                          >
                            {p.budget}%
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-sm tabular-nums text-muted-foreground">
                          {p.due}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs capitalize ${riskToneClasses[p.risk] ?? "text-muted-foreground"}`}>
                            {p.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights — not yet connected to any backend */}
        <ComingSoonCard
          title="AI insights"
          description="Portfolio-wide AI recommendations aren't wired to a backend yet. This panel will surface schedule, budget, and risk suggestions once that's built."
        />
      </section>

      {/* ── Bottom row — approvals + activity, neither backed yet ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ComingSoonCard
            title="Awaiting your approval"
            description="No approvals backend exists yet — this will surface pending budget, proposal, and workflow approvals once that module is built."
          />
        </div>
        <ComingSoonCard
          title="Activity & advisories"
          description="General project activity feed and site advisories aren't backed by any table yet."
        />
      </section>

      {/* ── Footer status ── */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <FileCheck2 className="h-3 w-3" />
        Live project data{c.loading ? " · loading…" : ""}
      </div>
    </div>
  );
}