import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Sparkles } from "lucide-react";
import { FEATURES } from "@/config/features";
import { issuesRepository, type IssuePrecedent } from "@/features/issues/repositories/issues.repository";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Card, CardContent } from "@/components/ui/card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useIssues } from "@/features/issues/hooks/use-issues";
import type { IssueRecord, UpdateIssueStatusInput } from "@/features/issues/repositories/issues.repository";

const STATUS_OPTIONS: UpdateIssueStatusInput["status"][] = [
  "Submitted",
  "Under Review",
  "Resolved",
  "Rejected",
];

function trim(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function IssueRow({
  issue,
  updating,
  precedents,
  onUpdate,
}: {
  issue: IssueRecord;
  updating: boolean;
  precedents: IssuePrecedent[];
  onUpdate: (status: UpdateIssueStatusInput["status"], resolutionNotes?: string) => void;
}) {
  const [nextStatus, setNextStatus] = useState<UpdateIssueStatusInput["status"]>(
    issue.status as UpdateIssueStatusInput["status"],
  );
  const [notes, setNotes] = useState("");
  const dirty = nextStatus !== issue.status;

  return (
    <div className="space-y-3 border-b border-border/60 p-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-muted-foreground">
            {issue.issueCode} · {issue.projectCode}
          </div>
          <div className="truncate text-sm font-medium">{issue.title}</div>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{issue.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={issue.severity} />
          <StatusBadge status={issue.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as UpdateIssueStatusInput["status"])}>
          <SelectTrigger className="h-8 w-44 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {dirty && (nextStatus === "Resolved" || nextStatus === "Rejected") && (
          <Textarea
            className="h-8 min-h-8 flex-1 text-xs"
            placeholder="Resolution notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}

        <Button
          size="sm"
          className="h-8 rounded-lg"
          disabled={!dirty || updating}
          onClick={() => onUpdate(nextStatus, notes || undefined)}
        >
          {updating ? "Saving…" : "Update status"}
        </Button>
      </div>

      {issue.status === "Resolved" && issue.siteContext && (
        <p className="text-xs text-muted-foreground">Location: {issue.siteContext}</p>
      )}

      {/* ai-signals E5: an open issue whose category has a resolved
          precedent elsewhere — decision support only, never changes what
          status this issue can be moved to. */}
      {FEATURES.ai &&
        (issue.status === "Submitted" || issue.status === "Under Review") &&
        precedents.length > 0 && (
          <div className="rounded-lg border border-ai/20 bg-ai-soft/30 p-2.5 text-xs">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="h-3 w-3 text-ai" />
              Resolved before
            </p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {precedents.slice(0, 2).map((p) => (
                <li key={p.issueCode}>
                  "{p.title}"{p.updatedAt ? ` (${p.updatedAt.slice(0, 10)})` : ""}: {trim(p.resolutionNotes, 160)}
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}

export default function IssuesPage() {
  const { issues, loading, error, updating, updateStatus } = useIssues();
  const [precedentsByCategory, setPrecedentsByCategory] = useState<Record<string, IssuePrecedent[]>>({});

  const openCategories = useMemo(
    () =>
      Array.from(
        new Set(
          issues
            .filter((i) => i.status === "Submitted" || i.status === "Under Review")
            .map((i) => i.category),
        ),
      ),
    [issues],
  );

  useEffect(() => {
    if (!FEATURES.ai || openCategories.length === 0) return;
    let cancelled = false;
    void Promise.all(
      openCategories.map(async (category) => {
        const res = await issuesRepository.precedentsByCategory(category);
        return [category, res.data] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setPrecedentsByCategory(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
    // openCategories is derived from `issues` each render — comparing its
    // contents (not identity) avoids re-fetching every unrelated update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCategories.join(",")]);

  const openCount = useMemo(
    () => issues.filter((i) => i.status === "Submitted").length,
    [issues],
  );
  const underReviewCount = useMemo(
    () => issues.filter((i) => i.status === "Under Review").length,
    [issues],
  );
  const criticalCount = useMemo(
    () => issues.filter((i) => i.severity === "Critical").length,
    [issues],
  );
  const resolvedCount = useMemo(
    () => issues.filter((i) => i.status === "Resolved").length,
    [issues],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Issues"
        description="Review issues reported from the field and record their resolution"
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <KpiStrip
          items={[
            { label: "Submitted", value: loading ? "…" : `${openCount}`, icon: AlertTriangle, tone: openCount > 0 ? "warn" : "neutral" },
            { label: "Under review", value: loading ? "…" : `${underReviewCount}`, icon: Clock },
            { label: "Critical", value: loading ? "…" : `${criticalCount}`, icon: ShieldAlert, tone: criticalCount > 0 ? "bad" : "neutral" },
            { label: "Resolved", value: loading ? "…" : `${resolvedCount}`, icon: CheckCircle2, tone: "good" },
          ]}
        />

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading issues…</div>
            ) : error ? (
              <div className="p-5 text-sm text-destructive">Couldn't load issues. {error}</div>
            ) : issues.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No issues reported yet — Site Personnel's reports will appear here.
              </div>
            ) : (
              <div>
                {issues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    updating={updating === issue.id}
                    precedents={precedentsByCategory[issue.category] ?? []}
                    onUpdate={(status, resolutionNotes) => updateStatus(issue.id, { status, resolutionNotes })}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}

IssuesPage.displayName = "IssuesPage";
