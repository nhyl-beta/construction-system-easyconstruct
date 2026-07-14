// src/pages/Dashboard.tsx
import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Users,
  FileCheck2,
  ChevronRight,
  Activity,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useRoleConfig } from "@/hooks/use-role-config";

import {
  dashboardKPIs,
  activeProjects,
  aiInsights,
  pendingApprovals,
  activityTimeline,
  workforceSummary,
  siteAdvisories,
} from "@/providers/mock-data";

// ── Badge tone map ────────────────────────────────────────────────────────────

const toneClasses: Record<string, string> = {
  success:     "bg-success/10 text-success border-success/20",
  info:        "bg-info/10 text-info border-info/20",
  warning:     "bg-warning/15 text-warning-foreground border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  muted:       "bg-muted text-muted-foreground border-border",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { identity } = useRoleConfig();
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
            Operations live
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Good morning, {firstName}.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            24 active projects across 9 sites. 3 items need your attention today,
            including a delayed pour on Harbor Logistics Hub.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">
            <FileCheck2 className="h-4 w-4" />
            Export report
          </Button>
          <Button className="rounded-xl">
            <Sparkles className="h-4 w-4" />
            Ask AI
          </Button>
        </div>
      </section>

      {/* ── KPI grid ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardKPIs.map((k) => (
          <Card key={k.label} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <k.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight">{k.value}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    k.trend === "up"
                      ? "inline-flex items-center gap-1 font-medium text-success"
                      : k.trend === "down"
                      ? "inline-flex items-center gap-1 font-medium text-destructive"
                      : "inline-flex items-center gap-1 font-medium text-muted-foreground"
                  }
                >
                  {k.trend === "up"   && <ArrowUpRight   className="h-3.5 w-3.5" />}
                  {k.trend === "down" && <ArrowDownRight  className="h-3.5 w-3.5" />}
                  {k.delta}
                </span>
                <span className="text-muted-foreground">{k.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ── Main grid — projects + AI ── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Projects table */}
        <Card className="rounded-2xl border-border/70 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Active projects</CardTitle>
              <p className="text-xs text-muted-foreground">5 of 24 — sorted by attention required</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
              View all <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
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
                  {activeProjects.map((p) => (
                    <tr
                      key={p.code}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium leading-tight">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.code} · PM {p.pm}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${toneClasses[p.statusTone]}`}
                        >
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
                        <span
                          className={
                            p.risk === "High"
                              ? "text-xs font-medium text-destructive"
                              : p.risk === "Medium"
                              ? "text-xs font-medium text-warning-foreground"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {p.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="rounded-2xl border-ai/20 bg-linear-to-br from-ai-soft/60 to-card shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="rounded-full border-ai/30 bg-ai/10 px-2.5 py-0.5 text-[11px] font-medium text-ai"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                AI assistant
              </Badge>
              <span className="text-[11px] text-muted-foreground">Advisory · explainable</span>
            </div>
            <CardTitle className="text-lg">Today's insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight, i) => (
              <div key={i} className="rounded-xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-medium leading-snug">{insight.title}</h4>
                  <Badge
                    variant="outline"
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                      insight.impact === "High" ? toneClasses.destructive : toneClasses.warning
                    }`}
                  >
                    {insight.impact} impact
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {insight.summary}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-ai"
                        style={{ width: `${insight.confidence}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-xs text-ai hover:bg-ai/10 hover:text-ai"
                  >
                    {insight.action} <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* ── Bottom row — approvals + activity ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Approvals */}
        <Card className="rounded-2xl border-border/70 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">Awaiting your approval</CardTitle>
              <p className="text-xs text-muted-foreground">4 items · oldest 2 days</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
              Open inbox <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {pendingApprovals.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 hover:bg-muted/30"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-secondary-foreground">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                      <span className="truncate text-sm font-medium">{a.title}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{a.owner}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      {a.age} old
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm font-medium tabular-nums sm:inline">
                    {a.amount}
                  </span>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg">
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity + workforce */}
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-lg">Today on the ground</CardTitle>
            <p className="text-xs text-muted-foreground">Workforce & activity stream</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workforce snapshot */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3">
              <div>
                <div className="text-xs text-muted-foreground">Present</div>
                <div className="text-lg font-semibold tabular-nums text-success">298</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Late</div>
                <div className="text-lg font-semibold tabular-nums text-warning-foreground">31</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Absent</div>
                <div className="text-lg font-semibold tabular-nums text-destructive">13</div>
              </div>
            </div>

            <Separator />

            {/* Activity feed */}
            <ul className="space-y-3">
              {activityTimeline.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      a.who === "AI Assistant" ? "bg-ai" : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug">
                      <span className="font-medium">{a.who}</span>{" "}
                      <span className="text-muted-foreground">{a.what}</span>
                    </p>
                    <span className="text-[11px] text-muted-foreground">{a.when} ago</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Weather advisory */}
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
                <div>
                  <p className="text-xs font-medium text-warning-foreground">Weather advisory</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Heavy rain expected at Harbor & Riverside sites Thursday.
                    Consider rescheduling exterior pours.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Footer status ── */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <Users className="h-3 w-3" />
        Showing data for 9 active sites · refreshed just now
      </div>
    </div>
  );
}