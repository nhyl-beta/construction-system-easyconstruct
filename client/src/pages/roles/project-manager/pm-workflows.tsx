import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewWorkflowDialog } from "@/components/workflows/new-workflow-dialog";
import {
  useActiveWorkflows,
  useWorkflowTemplates,
} from "@/features/workflows/hooks/useWorkflows";
import { WorkflowFormatService } from "@/features/workflows/services/workflow.service";
import { WorkflowStagePipeline } from "@/components/workflows/workflow-stage-pipeline";
import { EditWorkflowDialog } from "@/components/workflows/edit-workflow-dialog";
import { useAuth } from "@/auth/auth-context";
import type { Workflow } from "@/features/workflows/types/workflow.types";
import {
  GitBranch,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

export default function WorkflowsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const { templates, loading: templatesLoading, creating, createWorkflow } = useWorkflowTemplates();
  const { workflows, loading: workflowsLoading, reload, update, remove } = useActiveWorkflows();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Workflow builder
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure how documents, approvals, and decisions flow across
            departments.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New workflow
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-5">
        <TabsList className="h-10 rounded-xl">
          <TabsTrigger value="templates" className="rounded-lg">Templates</TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">Active pipeline</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg">AI suggestions</TabsTrigger>
        </TabsList>

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

        <TabsContent value="active" className="space-y-4">
          {workflowsLoading && (
            <p className="text-sm text-muted-foreground">Loading active workflows…</p>
          )}
          {!workflowsLoading && workflows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No active workflows. Use "New workflow" to initiate one.
            </p>
          )}
          {workflows.map((workflow) => {
            const canManage = isAdmin || workflow.createdBy === user?.name;
            return (
              <Card key={workflow.id} className="rounded-2xl border-border/70 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {workflow.code} · {workflow.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {workflow.projectCode} · {WorkflowFormatService.amount(workflow.amount)} · {workflow.templateName ?? "—"}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        title="Edit"
                        onClick={() => setEditingWorkflow(workflow)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                        title="Delete"
                        onClick={async () => {
                          if (!window.confirm(`Delete workflow "${workflow.title}"?`)) return;
                          await remove(workflow.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <WorkflowStagePipeline stages={workflow.stages} />
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="ai">
          <Card className="rounded-2xl border-ai/20 bg-linear-to-br from-ai-soft/60 to-card shadow-sm">
            <CardHeader>
              <Badge
                variant="outline"
                className="w-fit rounded-full border-ai/30 bg-ai/10 px-2.5 py-0.5 text-[11px] text-ai"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                AI recommendation — human review required
              </Badge>
              <CardTitle className="text-base">Not yet connected</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              This panel will surface AI-suggested pipeline optimizations
              (e.g. "this template's Finance stage is rarely rejected —
              consider fast-tracking it") once a real AI endpoint exists for
              workflows. Nothing here is auto-applied — a PM must review and
              accept, edit, or dismiss each suggestion.
            </CardContent>
          </Card>
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

      <EditWorkflowDialog
        workflow={editingWorkflow}
        onOpenChange={(next) => {
          if (!next) setEditingWorkflow(null);
        }}
        onSave={(id, title) => update(id, { title })}
      />
    </div>
  );
}