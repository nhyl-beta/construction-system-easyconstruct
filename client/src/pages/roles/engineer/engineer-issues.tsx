import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

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

function IssueRow({
  issue,
  updating,
  onUpdate,
}: {
  issue: IssueRecord;
  updating: boolean;
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
    </div>
  );
}

export default function IssuesPage() {
  const { issues, loading, error, updating, updateStatus } = useIssues();

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
