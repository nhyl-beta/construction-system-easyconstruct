// client/src/components/workflows/workflow-detail-dialog.tsx
//
// The one "what am I approving?" view, shared by every screen that decides on
// a workflow stage: the PM/Consultant/Engineer/HR/Finance Approvals page, the
// Admin's workflow oversight page, and the PM's own Workflows page.
//
// It shows the whole chain, not just the step in front of the approver:
//   - the stage pipeline, including each earlier stage's decision and comment
//   - every document and written submission filed at ANY stage
//   - the cost line items behind a budget-change request
//
// A previous version of this dialog lived inline in pm-approvals.tsx and
// rendered the pipeline only, which is why the Admin's final approval, the
// PM's sign-off and the Consultant's review all ended up deciding without the
// documents that had moved through the earlier stages.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { WorkflowStagePipeline } from "@/components/workflows/workflow-stage-pipeline";
import {
  WorkflowAttachmentList,
  WorkflowLineItemsTable,
} from "@/components/workflows/workflow-submission-panel";
import { useWorkflowDetail } from "@/features/workflows/hooks/useWorkflows";
import { WorkflowFormatService } from "@/features/workflows/services/workflow.service";

interface WorkflowDetailDialogProps {
  /** null closes the dialog; a number fetches and shows that workflow. */
  workflowId: number | null;
  onOpenChange: (open: boolean) => void;
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {count !== undefined && count > 0 && (
          <Badge variant="outline" className="rounded-full text-[10px]">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </section>
  );
}

export function WorkflowDetailDialog({
  workflowId,
  onOpenChange,
}: WorkflowDetailDialogProps) {
  const { workflow, loading, error } = useWorkflowDetail(workflowId);

  return (
    <Dialog open={workflowId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workflow ? `${workflow.code} · ${workflow.title}` : "Workflow details"}
          </DialogTitle>
          <DialogDescription>
            {workflow
              ? [
                  workflow.projectCode,
                  workflow.templateName ?? "—",
                  WorkflowFormatService.amount(workflow.amount),
                ].join(" · ")
              : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            Couldn't load this workflow. {error.message}
          </p>
        )}

        {workflow && (
          <div className="space-y-6 py-1">
            <Section title="Approval chain">
              <WorkflowStagePipeline stages={workflow.stages} direction="column" />
            </Section>

            {/* Rendered only for workflows that actually have cost lines —
                a design-approval chain has none, and an empty table on it
                would just be noise. */}
            {workflow.lineItems.length > 0 && (
              <Section title="Requested changes" count={workflow.lineItems.length}>
                <WorkflowLineItemsTable lineItems={workflow.lineItems} />
              </Section>
            )}

            <Section title="Submitted documents & data" count={workflow.attachments.length}>
              <WorkflowAttachmentList attachments={workflow.attachments} />
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

WorkflowDetailDialog.displayName = "WorkflowDetailDialog";
