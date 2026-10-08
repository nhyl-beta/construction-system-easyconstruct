// client/src/features/dashboard/components/PmPortfolioCharts.tsx
//
// PM dashboard charts: how the portfolio splits across lifecycle phases
// (donut) and where the open work sits (bar: open tasks per project). Both are
// computed from data the dashboard already has access to (own projects, own
// tasks) — nothing new on the server.
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { SectionCard } from "@/components/ui/section-card";
import { useProjectTaskProgress } from "@/features/tasks/hooks/use-project-task-progress";
import type { Project } from "@/features/projects/types/project.types";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

export function PmPortfolioCharts({ projects }: { projects: Project[] }) {
  const tasks = useProjectTaskProgress();

  const byPhase = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
    return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [projects]);

  const workload = useMemo(() => {
    const mine = new Set(projects.map((p) => p.code));
    return tasks.byProject
      .filter((t) => mine.has(t.projectCode))
      .map((t) => ({ project: t.projectCode, pending: t.pending, inProgress: t.inProgress }))
      .filter((t) => t.pending + t.inProgress > 0)
      .sort((a, b) => b.pending + b.inProgress - (a.pending + a.inProgress))
      .slice(0, 8);
  }, [projects, tasks.byProject]);

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SectionCard title="Projects by phase" subtitle="Where your portfolio sits in the lifecycle">
        {byPhase.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-48 w-48 shrink-0" role="img" aria-label={`Projects by phase: ${byPhase.map((d) => `${d.name} ${d.value}`).join(", ")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byPhase} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                    {byPhase.map((d, i) => (
                      <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-1.5 text-sm">
              {byPhase.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden />
                  <span className="flex-1">{d.name}</span>
                  <span className="tabular-nums text-muted-foreground">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Open workload" subtitle="Unfinished tasks per project (top 8)">
        {tasks.loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : workload.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No open tasks on your projects.</p>
        ) : (
          <div className="h-56" role="img" aria-label="Open tasks per project">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="project" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="inProgress" name="In progress" stackId="w" fill={PALETTE[0]} />
                <Bar dataKey="pending" name="Pending" stackId="w" fill={PALETTE[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>
    </section>
  );
}
