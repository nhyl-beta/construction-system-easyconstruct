import { Badge } from "@/components/ui/badge";

import type { WorkflowStatus } from "@/features/workflows/types/workflow.types";

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
}

export function WorkflowStatusBadge({
  status,
}: WorkflowStatusBadgeProps) {
  const labels: Record<WorkflowStatus, string> = {
    DRAFT: "Draft",
    PENDING_REVIEW: "Pending Review",
    IN_REVIEW: "In Review",
    APPROVED: "Approved",
    REVISION_REQUESTED: "Revision Requested",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
  };

  return (
    <Badge
      variant="outline"
      className="rounded-full"
    >
      {labels[status]}
    </Badge>
  );
}