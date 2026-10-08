import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type DesignRequest, type RequestKind, type RequestStatus } from "../types/request.types";

const TONE: Record<RequestStatus, string> = {
  draft: "border-transparent bg-muted text-muted-foreground",
  open: "border-transparent bg-info-soft text-info-strong",
  in_review: "border-transparent bg-warning-soft text-warning-strong",
  answered: "border-transparent bg-success-soft text-success-strong",
  approved: "border-transparent bg-success-soft text-success-strong",
  approved_as_noted: "border-transparent bg-primary-soft text-primary-strong",
  rejected: "border-transparent bg-destructive-soft text-destructive-strong",
  closed: "border-transparent bg-muted text-muted-foreground",
};

export function RequestStatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full text-overline font-medium", TONE[status], className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function KindBadge({ kind }: { kind: RequestKind }) {
  return (
    <Badge variant="outline" className="rounded-md px-1.5 font-mono text-overline font-semibold">
      {kind}
    </Badge>
  );
}

export function OverdueBadge({ request }: { request: Pick<DesignRequest, "isOverdue"> }) {
  if (!request.isOverdue) return null;
  return (
    <Badge variant="outline" className="rounded-full border-transparent bg-destructive-soft text-overline font-medium text-destructive-strong">
      Overdue
    </Badge>
  );
}

export const formatDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
