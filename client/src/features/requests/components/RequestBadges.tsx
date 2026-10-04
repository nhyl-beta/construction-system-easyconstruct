import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type DesignRequest, type RequestKind, type RequestStatus } from "../types/request.types";

const TONE: Record<RequestStatus, string> = {
  draft: "border-slate-400/40 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  open: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_review: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  answered: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  approved_as_noted: "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  rejected: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  closed: "border-slate-400/40 bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

export function RequestStatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full text-[10px] font-medium", TONE[status], className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function KindBadge({ kind }: { kind: RequestKind }) {
  return (
    <Badge variant="outline" className="rounded-md px-1.5 font-mono text-[10px] font-semibold">
      {kind}
    </Badge>
  );
}

export function OverdueBadge({ request }: { request: Pick<DesignRequest, "isOverdue"> }) {
  if (!request.isOverdue) return null;
  return (
    <Badge variant="outline" className="rounded-full border-red-500/50 bg-red-500/10 text-[10px] font-medium text-red-700 dark:text-red-300">
      Overdue
    </Badge>
  );
}

export const formatDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
