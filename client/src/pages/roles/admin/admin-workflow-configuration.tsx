import { useState } from "react";
import { GitBranch, Info, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { NewWorkflowTemplateDialog } from "@/components/workflows/new-workflow-template-dialog";
import { useWorkflowTemplates } from "@/features/workflows/hooks/useWorkflows";
import { WorkflowFormatService } from "@/features/workflows/services/workflow.service";

export default function AdminWorkflowConfigurationPage() {
  const { templates, loading, error, creatingTemplate, createTemplate } =
    useWorkflowTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <PageContainer>
      <PageHeader
        title="Workflow configuration"
        description="Define custom workflow templates — the stage sequence each one runs through — and see every template available for initiation."
        actions={
          <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New template
          </Button>
        }
      />
      <PageContent className="space-y-4 p-6 md:p-8">
        <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Templates define the stage/role sequence new workflows are
            created from. A template built here is usable everywhere a
            seeded one is — from the Workflows page, and from every role's
            own "start a workflow" action — the moment it's created.
          </p>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading templates…</p>}
        {!loading && error && (
          <p className="text-sm text-destructive">Couldn't load templates. {error.message}</p>
        )}
        {!loading && !error && templates.length === 0 && (
          <p className="text-sm text-muted-foreground">No workflow templates configured yet.</p>
        )}

        <div className="space-y-4">
          {templates.map((t) => (
            <Card key={t.id} className="rounded-2xl border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {t.activeCount} active · avg {WorkflowFormatService.avgDuration(t.avgDurationHours)}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {t.defaultStages.map((stage, i) => (
                    <span key={`${t.id}-${stage.role}`} className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                        {i + 1}. {stage.roleLabel}
                      </Badge>
                      {i < t.defaultStages.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContent>

      <NewWorkflowTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        creating={creatingTemplate}
        onSubmit={createTemplate}
      />
    </PageContainer>
  );
}

AdminWorkflowConfigurationPage.displayName = "AdminWorkflowConfigurationPage";
