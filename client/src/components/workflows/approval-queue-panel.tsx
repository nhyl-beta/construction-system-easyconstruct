// client/src/components/workflows/approval-queue-panel.tsx
//
// The approval queue, once. Every role that decides on a workflow stage sees
// this: Project Manager, Consultant, Engineer, Finance Manager, Human
// Resources and Architect through /approvals, and Admin / IT Designer through
// the Approvals tab of workflow oversight. The server scopes the queue to the
// caller's own role, so the same component serves all of them.
//
// It was previously copied between pm-approvals.tsx and admin-workflows.tsx,
// which is how the Admin's final-approval view ended up without the "view
// details" action the PM's had — the admin, deciding last, could see the least.
// One component means a fix to what an approver can see before deciding lands
// for every role at the same time.
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  ListTree,
  Paperclip,
  PenLine,
  Search,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DataTablePagination } from "@/components/refine-ui/data-table/data-table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/auth/auth-context";
import { WorkflowDetailDialog } from "@/components/workflows/workflow-detail-dialog";
import { WorkflowInitiationActions } from "@/components/workflows/workflow-initiation-actions";
import { useApprovals } from "@/features/workflows/hooks/useWorkflows";
import { WorkflowRepository } from "@/features/workflows/repositories/workflow.repository";
import { WorkflowFormatService } from "@/features/workflows/services/workflow.service";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ApprovalScope } from "@/features/workflows/types/workflow.types";

const ALL = "all";

// "medium" is text-warning, not text-warning-foreground — that token is dark
// ink meant for text ON a filled bg-warning chip, not standalone text on a
// translucent bg-warning/15 tint; its dark-mode value is nearly black.
const SEVERITY_TONE: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

interface ApprovalQueuePanelProps {
  /** Copy for the empty "pending" state — org-wide on the admin screen. */
  emptyPendingMessage?: string;
  /** Admin's oversight page has its own "New workflow" button above. */
  showInitiationActions?: boolean;
}

export function ApprovalQueuePanel({
  emptyPendingMessage = "Nothing pending your decision.",
  showInitiationActions = true,
}: ApprovalQueuePanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<ApprovalScope>("pending");
  const { items, stats, loading, deciding, error, decide, reload } = useApprovals(tab);
  const [comments, setComments] = useState<Record<number, string>>({});
  // A document Finance (or any approver) attaches to the workflow before
  // deciding on it — e.g. Finance's own cost-impact worksheet on a budget
  // change. Uploaded immediately on "Attach", independently of the eventual
  // decision, so it is filed against the workflow (and visible in "View
  // details") whether the approver ends up approving, rejecting or asking
  // for revision.
  const [pendingFiles, setPendingFiles] = useState<Record<number, File | null>>({});
  const [uploadingStageId, setUploadingStageId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const attachDocument = async (workflowId: number, stageId: number) => {
    const file = pendingFiles[stageId];
    if (!file) return;
    setUploadingStageId(stageId);
    setUploadError(null);
    try {
      await WorkflowRepository.uploadAttachment(workflowId, file, file.name);
      setPendingFiles((prev) => ({ ...prev, [stageId]: null }));
      await reload();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to attach the document.",
      );
    } finally {
      setUploadingStageId(null);
    }
  };
  const [detailWorkflowId, setDetailWorkflowId] = useState<number | null>(null);

  // G2: real filters over what useApprovals already fetches for this tab —
  // same "fetch the tab's full set, filter/paginate client-side" convention
  // as most other lists in the app (see hooks/use-pagination.ts) — plus real
  // pagination in place of rendering every item with no page boundary.
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [requesterFilter, setRequesterFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const typeOptions = useMemo(
    () => Array.from(new Set(items.map((a) => a.type).filter((t): t is string => !!t))).sort(),
    [items],
  );
  const requesterOptions = useMemo(
    () => Array.from(new Set(items.map((a) => a.requestedBy).filter((r): r is string => !!r))).sort(),
    [items],
  );

  const filteredItems = useMemo(() => {
    return items.filter((a) => {
      if (typeFilter && a.type !== typeFilter) return false;
      if (requesterFilter && a.requestedBy !== requesterFilter) return false;
      if (dateFrom && (!a.createdAt || a.createdAt.slice(0, 10) < dateFrom)) return false;
      if (dateTo && (!a.createdAt || a.createdAt.slice(0, 10) > dateTo)) return false;
      if (search) {
        const term = search.toLowerCase();
        const haystack = `${a.workflowCode} ${a.title} ${a.projectCode} ${a.requestedBy ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [items, typeFilter, requesterFilter, dateFrom, dateTo, search]);

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (search) activeFilters.push({ key: "search", label: `Search: "${search}"`, clear: () => setSearchInput("") });
  if (typeFilter) activeFilters.push({ key: "type", label: `Type: ${typeFilter}`, clear: () => setTypeFilter(null) });
  if (requesterFilter) activeFilters.push({ key: "requester", label: `Requested by: ${requesterFilter}`, clear: () => setRequesterFilter(null) });
  if (dateFrom) activeFilters.push({ key: "dateFrom", label: `From: ${dateFrom}`, clear: () => setDateFrom("") });
  if (dateTo) activeFilters.push({ key: "dateTo", label: `To: ${dateTo}`, clear: () => setDateTo("") });

  const pagination = usePagination(filteredItems, 10);
  // Any filter (or the tab itself) changing resets to page 1 — otherwise a
  // narrower result set can leave the view stranded on a now-empty page.
  useEffect(() => {
    pagination.setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, typeFilter, requesterFilter, dateFrom, dateTo]);

  // IT Designer's workflow scope is read-only, enforced first on the server
  // (server/src/workflows/routes.ts) — decide/attach would 403 there even if
  // shown here. Hidden client-side too, so IT Designer doesn't hit a wall of
  // silent failures on buttons that were never going to work for this role.
  const canDecide = user?.role !== "it-designer";

  const statCards = stats
    ? [
        { label: "Pending", value: `${stats.pending}`, tone: "text-foreground" },
        {
          label: "Overdue",
          value: `${stats.overdue}`,
          tone: stats.overdue > 0 ? "text-destructive" : "text-foreground",
        },
        { label: "Avg cycle", value: `${stats.avgCycleDays}d`, tone: "text-foreground" },
        { label: "This week", value: `${stats.thisWeek}`, tone: "text-foreground" },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Roles that own a stage in a template can also start the chain that
          reaches it — Architect, Engineer and HR each get their own actions
          here; every other role sees nothing. */}
      {showInitiationActions && (
        <WorkflowInitiationActions role={user?.role ?? ""} onCreated={() => void reload()} />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="space-y-1 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
              <div className={`text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ApprovalScope)}>
          <TabsList className="h-10 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg">
              Pending
            </TabsTrigger>
            <TabsTrigger value="mine" className="rounded-lg">
              Decided by me
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={typeFilter ?? ALL} onValueChange={(v) => setTypeFilter(v === ALL ? null : v)}>
          <SelectTrigger className="h-9 w-36 rounded-xl text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={requesterFilter ?? ALL} onValueChange={(v) => setRequesterFilter(v === ALL ? null : v)}>
          <SelectTrigger className="h-9 w-40 rounded-xl text-xs">
            <SelectValue placeholder="All requesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All requesters</SelectItem>
            {requesterOptions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label="From date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 w-36 rounded-xl text-xs"
        />
        <Input
          type="date"
          aria-label="To date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 w-36 rounded-xl text-xs"
        />
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search approvals…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 rounded-xl bg-muted/40 pl-9"
          />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Badge
              key={f.key}
              variant="outline"
              className="flex items-center gap-1 rounded-full border-primary/30 text-[11px] text-primary"
            >
              {f.label}
              <button type="button" onClick={f.clear} aria-label={`Clear ${f.label}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setTypeFilter(null);
              setRequesterFilter(null);
              setDateFrom("");
              setDateTo("");
            }}
            className="text-[11px] text-muted-foreground underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* A failed decision used to be swallowed into hook state with nothing
          on screen, which reads as "the button does nothing". */}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error.message}
        </p>
      )}

      {uploadError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {uploadError}
        </p>
      )}

      <div className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading approvals…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {tab === "pending" ? emptyPendingMessage : "No items here yet."}
          </p>
        )}
        {!loading && items.length > 0 && filteredItems.length === 0 && (
          <p className="text-sm text-muted-foreground">No approvals match your filters.</p>
        )}
        {pagination.pageItems.map((a) => (
          <Card key={a.stageId} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-secondary-foreground">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {a.workflowCode}
                      </span>
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

                    {/* Says there is something to read before deciding — a row
                        that advertises nothing is a row nobody opens. */}
                    {(a.attachmentCount > 0 || a.lineItemCount > 0) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {a.attachmentCount > 0 && (
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            <Paperclip className="mr-1 h-3 w-3" />
                            {a.attachmentCount} submitted{" "}
                            {a.attachmentCount === 1 ? "item" : "items"}
                          </Badge>
                        )}
                        {a.lineItemCount > 0 && (
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            <ListTree className="mr-1 h-3 w-3" />
                            {a.lineItemCount} cost{" "}
                            {a.lineItemCount === 1 ? "change" : "changes"}
                          </Badge>
                        )}
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
                  {tab === "pending" && !canDecide ? (
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      Read-only
                    </Badge>
                  ) : tab === "pending" ? (
                    <div className="flex w-full flex-col items-end gap-2 md:w-174">
                      {/* Finance needed a way to attach its own cost-impact
                          document to a budget change before approving it —
                          there was no upload affordance anywhere on this
                          screen, only the comment box. Any approver can use
                          it; it is not finance-specific in the component. */}
                      <div className="flex w-full items-center gap-1.5">
                        {/* The native <input type="file"> renders its own
                            "Choose File" / "No file chosen" text, which
                            can't be shortened via `placeholder` and wrapped
                            badly once squeezed next to the Attach button.
                            Hidden input + our own truncated label, same
                            pattern as architect-design-create.tsx. */}
                        <label className="flex h-8 flex-1 min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-xs hover:border-primary/40">
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">
                            {pendingFiles[a.stageId]?.name ?? "Choose file"}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) =>
                              setPendingFiles((prev) => ({
                                ...prev,
                                [a.stageId]: e.target.files?.[0] ?? null,
                              }))
                            }
                          />
                        </label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0 rounded-lg text-xs"
                          disabled={!pendingFiles[a.stageId] || uploadingStageId === a.stageId}
                          onClick={() => void attachDocument(a.workflowId, a.stageId)}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploadingStageId === a.stageId ? "Attaching…" : "Attach"}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Add a comment or justification (optional)"
                        className="min-h-16 rounded-lg text-xs"
                        value={comments[a.stageId] ?? ""}
                        onChange={(e) =>
                          setComments((prev) => ({ ...prev, [a.stageId]: e.target.value }))
                        }
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-lg"
                          disabled={deciding === a.stageId}
                          title="Send back to the submitter for revision"
                          onClick={() =>
                            decide(a.workflowId, a.stageId, {
                              decision: "revise",
                              comments: comments[a.stageId]?.trim() || undefined,
                            })
                          }
                        >
                          <PenLine className="h-3.5 w-3.5" /> Request revision
                        </Button>
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
        {!loading && filteredItems.length > 0 && (
          <div className="rounded-2xl border border-border/70 px-2 py-2">
            <DataTablePagination {...pagination} />
          </div>
        )}
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

ApprovalQueuePanel.displayName = "ApprovalQueuePanel";
