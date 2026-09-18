// src/pages/project-manager/pm-approvals.tsx
import { useEffect, useState } from "react";
import {
  Eye,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }             from "@/components/ui/badge";
import { Button }            from "@/components/ui/button";
import { Textarea }          from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApprovals } from "@/features/workflows/hooks/useWorkflows";
import { WorkflowRepository } from "@/features/workflows/repositories/workflow.repository";
import { WorkflowFormatService } from "@/features/workflows/services/workflow.service";
import { WorkflowStagePipeline } from "@/components/workflows/workflow-stage-pipeline";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ApprovalScope, Workflow } from "@/features/workflows/types/workflow.types";

function WorkflowDetailDialog({
  workflowId,
  onOpenChange,
}: {
  workflowId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);

  const open = workflowId !== null;

  useEffect(() => {
    if (workflowId === null) return;
    let cancelled = false;
    setLoading(true);
    WorkflowRepository.getById(workflowId)
      .then((wf) => {
        if (!cancelled) setWorkflow(wf);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setWorkflow(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {workflow ? `${workflow.code} · ${workflow.title}` : "Workflow details"}
          </DialogTitle>
          <DialogDescription>
            {workflow
              ? `${workflow.projectCode} · ${workflow.templateName ?? "—"}`
              : "Loading…"}
          </DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {workflow && <WorkflowStagePipeline stages={workflow.stages} direction="column" />}
      </DialogContent>
    </Dialog>
  );
}

const SEVERITY_TONE: Record<string, string> = {
  high:   "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low:    "bg-muted text-muted-foreground border-border",
};

export default function ApprovalsPage() {
  const [tab, setTab] = useState<ApprovalScope>("pending");
  const { items, stats, loading, deciding, decide } = useApprovals(tab);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [detailWorkflowId, setDetailWorkflowId] = useState<number | null>(null);

  const statCards = stats
    ? [
        { label: "Pending", value: `${stats.pending}`, tone: "text-foreground" },
        { label: "Overdue", value: `${stats.overdue}`, tone: stats.overdue > 0 ? "text-destructive" : "text-foreground" },
        { label: "Avg cycle", value: `${stats.avgCycleDays}d`, tone: "text-foreground" },
        { label: "This week", value: `${stats.thisWeek}`, tone: "text-foreground" },
      ]
    : [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="space-y-1 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ApprovalScope)}>
          <TabsList className="h-10 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="mine"    className="rounded-lg">Decided by me</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
          </TabsList>
        </Tabs>
        {/* Filters / bulk-approve have no backend behind them yet — disabled
            rather than left as dead clickable buttons that silently do
            nothing. */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" disabled title="Coming soon">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading approvals…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {tab === "pending" ? "Nothing pending your decision." : "No items here yet."}
          </p>
        )}
        {items.map((a) => (
          <Card key={a.stageId} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-secondary-foreground">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{a.workflowCode}</span>
                      <span className="font-medium">{a.title}</span>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2 py-0.5 text-[10px] ${SEVERITY_TONE[a.severity]}`}
                      >
                        {a.severity}
                      </Badge>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{a.projectCode}</span>
                      <span>·</span>
                      <span>{a.type ?? "—"}</span>
                      <span>·</span>
                      <span>{a.ownerRoleLabel}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatRelativeTime(a.createdAt)}
                      </span>
                    </div>

                    {a.aiNote && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-ai-soft/40 p-2 text-xs text-muted-foreground">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-ai" />
                        <span>
                          <span className="font-medium text-ai">AI:</span> {a.aiNote}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  <span className="text-sm font-medium tabular-nums">
                    {WorkflowFormatService.amount(a.amount)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-lg text-xs"
                    onClick={() => setDetailWorkflowId(a.workflowId)}
                  >
                    <Eye className="h-3.5 w-3.5" /> View details
                  </Button>
                  {tab === "pending" ? (
                    <div className="flex w-full flex-col items-end gap-2 md:w-64">
                      <Textarea
                        placeholder="Add a comment or justification (optional)"
                        className="min-h-16 rounded-lg text-xs"
                        value={comments[a.stageId] ?? ""}
                        onChange={(e) =>
                          setComments((prev) => ({ ...prev, [a.stageId]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg"
                          disabled={deciding === a.stageId}
                          onClick={() =>
                            decide(a.workflowId, a.stageId, {
                              decision: "reject",
                              comments: comments[a.stageId]?.trim() || undefined,
                            })
                          }
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 rounded-lg"
                          disabled={deciding === a.stageId}
                          onClick={() =>
                            decide(a.workflowId, a.stageId, {
                              decision: "approve",
                              comments: comments[a.stageId]?.trim() || undefined,
                            })
                          }
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {deciding === a.stageId ? "Saving…" : "Approve"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="rounded-full text-[10px] capitalize">
                      {a.status.replace("-", " ")}
                    </Badge>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <WorkflowDetailDialog
        workflowId={detailWorkflowId}
        onOpenChange={(next) => {
          if (!next) setDetailWorkflowId(null);
        }}
      />
    </div>
  );
}