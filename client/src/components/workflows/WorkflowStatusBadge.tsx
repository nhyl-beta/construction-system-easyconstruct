import type { WorkflowStatus } from "@/features/workflows/types/workflow.types";

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
}

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  active: "Active",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<WorkflowStatus, string> = {
  active:
    "border-blue-200 bg-blue-50 text-blue-700",
  completed:
    "border-green-200 bg-green-50 text-green-700",
  rejected:
    "border-red-200 bg-red-50 text-red-700",
  cancelled:
    "border-gray-200 bg-gray-50 text-gray-700",
};

export function WorkflowStatusBadge({
  status,
}: WorkflowStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
