import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewWorkflowDialog } from "@/components/workflows/new-workflow-dialog";
import {
  useActiveWorkflows,
  useApprovals,
  useWorkflowTemplates,
} from "@/features/workflows/hooks/useWorkflows";
import { WorkflowFormatService } from "@/features/workflows/services/workflow.service";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ApprovalScope } from "@/features/workflows/types/workflow.types";
import {
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  FileSignature,
  FileCheck2,
  Filter,
  GitBranch,
  Plus,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const WORKFLOW_STAGE_ICONS: Record<string, LucideIcon> = {
  UserCheck,
  Wallet,
  ShieldCheck,
  FileSignature,
};

const SEVERITY_TONE: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

function ApprovalsPanel() {
  const [tab, setTab] = useState<ApprovalScope>("pending");
  const { items, stats, loading, deciding, decide } = useApprovals(tab);
  const [comments, setComments] = useState<Record<number, string>>({});

  const statCards = stats
    ? [
        { label: "Pending", value: `${stats.pending}`, tone: "text-foreground" },
        { label: "Overdue", value: `${stats.overdue}`, tone: stats.overdue > 0 ? "text-destructive" : "text-foreground" },
        { label: "Avg cycle", value: `${stats.avgCycleDays}d`, tone: "text-foreground" },
        { label: "This week", value: `${stats.thisWeek}`, tone: "text-foreground" },
      ]
    : [];

  return (
    <div className="space-y-5">
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
            <TabsTrigger value="mine" className="rounded-lg">Decided by me</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="rounded-xl" disabled title="Coming soon">
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading approvals…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {tab === "pending" ? "Nothing pending across the organization." : "No items here yet."}
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
                      <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] ${SEVERITY_TONE[a.severity]}`}>
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
    </div>
  );
}

export default function AdminWorkflowsPage() {
  const { templates, loading: templatesLoading, creating, createWorkflow } = useWorkflowTemplates();
  const { workflows, loading: workflowsLoading, reload } = useActiveWorkflows();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Workflow oversight</h2>
          <p className="text-sm text-muted-foreground">
            Initiate approval, document routing, and coordination workflows,
            then monitor them through to completion across every role.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New workflow
        </Button>
      </div>

      <Tabs defaultValue="approvals" className="space-y-5">
        <TabsList className="h-10 rounded-xl">
          <TabsTrigger value="approvals" className="rounded-lg">
            <CheckSquare className="h-3.5 w-3.5" /> Approvals
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">Active pipeline</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <ApprovalsPanel />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {workflowsLoading && (
            <p className="text-sm text-muted-foreground">Loading active workflows…</p>
          )}
          {!workflowsLoading && workflows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No active workflows. Use "New workflow" to initiate one.
            </p>
          )}
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="rounded-2xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  {workflow.code} · {workflow.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {workflow.projectCode} · {WorkflowFormatService.amount(workflow.amount)} · {workflow.templateName ?? "—"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
                  {workflow.stages.map((stage, i) => {
                    const Icon = WORKFLOW_STAGE_ICONS[stage.iconKey] ?? UserCheck;
                    return (
                      <div key={stage.id} className="flex flex-1 items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 ${
                            stage.status === "done"
                              ? "border-success bg-success/10 text-success"
                              : stage.status === "current"
                              ? "border-primary bg-primary/10 text-primary"
                              : stage.status === "rejected"
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{stage.roleLabel}</span>
                            {stage.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                            {stage.status === "current" && <Clock className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stage.decidedBy ?? stage.assignedTo ?? "Unassigned"} ·{" "}
                            {stage.decidedAt
                              ? formatRelativeTime(stage.decidedAt)
                              : stage.status === "current"
                              ? "In progress"
                              : "Not started"}
                          </div>
                        </div>
                        {i < workflow.stages.length - 1 && (
                          <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="templates" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {templatesLoading && (
            <p className="text-sm text-muted-foreground">Loading templates…</p>
          )}
          {!templatesLoading && templates.length === 0 && (
            <p className="text-sm text-muted-foreground">No workflow templates configured yet.</p>
          )}
          {templates.map((t) => (
            <Card key={t.id} className="rounded-2xl border-border/70 shadow-sm">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium leading-tight">{t.name}</h3>
                  </div>
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {t.activeCount} active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted-foreground">
                    {t.defaultStages.length} stages · avg {WorkflowFormatService.avgDuration(t.avgDurationHours)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <NewWorkflowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        templates={templates}
        creating={creating}
        onSubmit={async (input) => {
          const created = await createWorkflow(input);
          if (created) await reload();
          return created;
        }}
      />
    </div>
  );
}

AdminWorkflowsPage.displayName = "AdminWorkflowsPage";
