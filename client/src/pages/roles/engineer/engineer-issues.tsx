import { AlertTriangle, ShieldAlert, Wrench } from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiStrip } from "@/components/ui/kpi-strip";

import { useEngineeringReports } from "@/features/engineering-reports/hooks/useEngineeringReport";
import { ISSUE_REPORT_TYPES } from "@/features/engineering-reports/types/engineering-reports.types";
import { EngineeringReportService } from "@/features/engineering-reports/services/engineering-report.service";
import {
  NewReportDialog,
  PriorityBadge,
  ReportStatusBadge,
} from "@/pages/roles/shared/shared-engineer";
import { useAuth } from "@/auth/auth-context";

export default function IssuesPage() {
  const { user } = useAuth();
  const { reports, loading, createReport } = useEngineeringReports("issues");

  const criticalFlags = EngineeringReportService.countByPriority(reports, "Critical");
  const nonConformance = reports.filter((r) => r.type === "Non-Conformance Report").length;
  const needsRevision = EngineeringReportService.countByStatus(reports, "Revision Required");

  return (
    <PageContainer>
      <PageHeader
        title="Issues"
        description="Track and resolve construction and technical issues"
        actions={
          <NewReportDialog
            typeOptions={ISSUE_REPORT_TYPES}
            triggerLabel="Report issue"
            createReport={createReport}
            engineerName={user?.name ?? "Unknown"}
          />
        }
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <KpiStrip
          items={[
            {
              label: "Open issues",
              value: loading ? "…" : `${reports.length}`,
              icon: AlertTriangle,
              tone: reports.length > 0 ? "warn" : "neutral",
              hint: "safety + non-conformance",
            },
            {
              label: "Critical flags",
              value: loading ? "…" : `${criticalFlags}`,
              icon: ShieldAlert,
              tone: criticalFlags > 0 ? "bad" : "neutral",
              hint: "critical priority",
            },
            {
              label: "Non-conformance",
              value: loading ? "…" : `${nonConformance}`,
              icon: Wrench,
              hint: "reports filed",
            },
            {
              label: "Needs revision",
              value: loading ? "…" : `${needsRevision}`,
              icon: AlertTriangle,
              tone: needsRevision > 0 ? "warn" : "neutral",
              hint: "action required",
            },
          ]}
        />

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Open issues</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading issues…</div>
            ) : reports.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No issues on file — use "Report issue" to flag one.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">
                        {r.id} · {r.type}
                      </div>
                      <div className="truncate text-sm font-medium">
                        {r.project} · {r.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.engineer} · {r.location} · {r.updatedAgo}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={r.priority} />
                      <ReportStatusBadge status={r.status} />
                    </div>
                  </div>
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