import { ClipboardList, FileSearch, ShieldCheck } from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiStrip } from "@/components/ui/kpi-strip";

import { useEngineeringReports } from "@/features/engineering-reports/hooks/useEngineeringReport";
import { PROGRESS_REPORT_TYPES } from "@/features/engineering-reports/types/engineering-reports.types";
import { EngineeringReportService } from "@/features/engineering-reports/services/engineering-report.service";
import { NewReportDialog, ReportStatusBadge } from "@/pages/roles/shared/shared-engineer";
import { useAuth } from "@/auth/auth-context";

export default function ProgressPage() {
  const { user } = useAuth();
  const { reports, loading, createReport } = useEngineeringReports("progress");

  const openInspections = reports.filter(
    (r) => r.type === "Site Inspection" && r.status !== "Approved",
  ).length;
  const technicalReviews = reports.filter((r) => r.type === "Technical Report").length;
  const underReview = EngineeringReportService.countByStatus(reports, "Under Review");

  return (
    <PageContainer>
      <PageHeader
        title="Progress"
        description="Track construction progress and site reports"
        actions={
          <NewReportDialog
            typeOptions={PROGRESS_REPORT_TYPES}
            createReport={createReport}
            engineerName={user?.name ?? "Unknown"}
          />
        }
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <KpiStrip
          items={[
            {
              label: "Site reports",
              value: loading ? "…" : `${reports.length}`,
              icon: ClipboardList,
              hint: "progress-related reports",
            },
            {
              label: "Open inspections",
              value: loading ? "…" : `${openInspections}`,
              icon: ShieldCheck,
              tone: openInspections > 0 ? "warn" : "neutral",
              hint: "not yet approved",
            },
            {
              label: "Technical reports",
              value: loading ? "…" : `${technicalReviews}`,
              icon: FileSearch,
              hint: "on file",
            },
            {
              label: "Under review",
              value: loading ? "…" : `${underReview}`,
              icon: FileSearch,
              tone: underReview > 0 ? "warn" : "neutral",
              hint: "awaiting sign-off",
            },
          ]}
        />

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent site reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading reports…</div>
            ) : reports.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No progress reports yet — file one with "New report".
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
                    <ReportStatusBadge status={r.status} />
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

ProgressPage.displayName = "ProgressPage";