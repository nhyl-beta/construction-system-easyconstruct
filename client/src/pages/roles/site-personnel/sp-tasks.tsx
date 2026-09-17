import { CheckSquare, Clock, ListTodo, ShieldAlert } from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Card, CardContent } from "@/components/ui/card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { useMyTasks } from "@/features/tasks/hooks/use-my-tasks";

const NEXT_LABEL: Record<string, string> = {
  Pending: "Start task",
  "In Progress": "Mark complete",
};

export default function TasksPage() {
  const { tasks, counts, loading, error, updatingId, advance } = useMyTasks();

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Your assigned field tasks — updates here are visible to Engineering and Admin"
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <KpiStrip
          items={[
            { label: "Total", value: loading ? "…" : `${counts.total}`, icon: ListTodo },
            { label: "Pending", value: loading ? "…" : `${counts.pending}`, icon: Clock, tone: counts.pending > 0 ? "warn" : "neutral" },
            { label: "In progress", value: loading ? "…" : `${counts.inProgress}`, icon: Clock },
            { label: "Overdue", value: loading ? "…" : `${counts.overdue}`, icon: ShieldAlert, tone: counts.overdue > 0 ? "bad" : "neutral" },
          ]}
        />

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading tasks…</div>
            ) : error ? (
              <div className="p-5 text-sm text-destructive">Couldn't load tasks. {error}</div>
            ) : tasks.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No tasks assigned to you yet.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {tasks.map((t) => {
                  const nextLabel = NEXT_LABEL[t.status];
                  return (
                    <div key={t.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">
                          {t.taskCode} · {t.projectCode}
                        </div>
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        {t.description && (
                          <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">{t.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={t.progress} className="h-1.5 w-32" />
                          <span className="text-xs tabular-nums text-muted-foreground">{t.progress}%</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={t.priority} />
                        <StatusBadge status={t.status} />
                        {nextLabel && (
                          <Button
                            size="sm"
                            className="h-8 rounded-lg"
                            disabled={updatingId === t.id}
                            onClick={() => advance(t)}
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                            {updatingId === t.id ? "Saving…" : nextLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}

TasksPage.displayName = "TasksPage";
