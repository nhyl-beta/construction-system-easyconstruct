import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { WorkflowStatusBadge } from "./WorkflowStatusBadge";

import type {
  WorkflowItem,
  WorkflowRole,
} from "@/features/workflows/types/workflow.types";

interface WorkflowCardProps {
  workflow: WorkflowItem;

  currentRole: WorkflowRole;

  onApprove?: (workflow: WorkflowItem) => void;

  onRequestRevision?: (workflow: WorkflowItem) => void;
}

export function WorkflowCard({
  workflow,
  currentRole,
  onApprove,
  onRequestRevision,
}: WorkflowCardProps) {
  const canAct =
    workflow.assignedTo === currentRole &&
    workflow.status !== "APPROVED" &&
    workflow.status !== "COMPLETED";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {workflow.id}
          </p>

          <h3 className="font-semibold">
            {workflow.title}
          </h3>

          {workflow.projectName && (
            <p className="text-sm text-muted-foreground">
              {workflow.projectName}
            </p>
          )}
        </div>

        <WorkflowStatusBadge status={workflow.status} />
      </CardHeader>

      <CardContent className="space-y-4">
        {workflow.description && (
          <p className="text-sm text-muted-foreground">
            {workflow.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">
              Created by
            </p>

            <p className="font-medium">
              {workflow.createdBy}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Assigned to
            </p>

            <p className="font-medium">
              {workflow.assignedTo}
            </p>
          </div>
        </div>

        {canAct && (
          <div className="flex gap-2">
            {onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(workflow)}
              >
                Approve
              </Button>
            )}

            {onRequestRevision && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onRequestRevision(workflow)
                }
              >
                Request Revision
              </Button>
            )}
          </div>
        )}

        {workflow.comments &&
          workflow.comments.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium">
                Latest comment
              </p>

              <p className="text-sm text-muted-foreground">
                {
                  workflow.comments[
                    workflow.comments.length - 1
                  ]
                }
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}