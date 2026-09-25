// client/src/pages/roles/shared/shared-reports.tsx
//
// Q5: this was a bare ComingSoonCard, which is what gate X1's failing-check
// link ("Final inspection approved" → /reports) sent a Project Manager to —
// clicking the one indicator telling them something needed their decision
// landed them on a stub with nothing to click. Now a real list of
// engineering reports, with Approve/Reject/Request revision for the roles
// the server actually lets decide (project-manager, admin — see
// server/src/engineering-reports/service.ts assertCanSetStatus); every
// other role that reaches this page (owner, HR, finance) sees the same
// list read-only, which is still strictly more useful than a stub.
import { useMemo, useState } from "react";
import { Check, ClipboardCheck, PenLine, X } from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/auth/auth-context";
import { useEngineeringReports } from "@/features/engineering-reports/hooks/useEngineeringReport";
import {
  PriorityBadge,
  ReportStatusBadge,
} from "@/pages/roles/shared/shared-engineer";
import type { ReportStatus } from "@/features/engineering-reports/types/engineering-reports.types";

const DECISION_TABS = ["pending", "approved", "rejected"] as const;
type DecisionTab = (typeof DECISION_TABS)[number];

const PENDING_STATUSES: ReportStatus[] = ["Submitted", "Under Review"];

export default function SharedReportsPage() {
  const { user } = useAuth();
  const canDecide = user?.role === "project-manager" || user?.role === "admin";
  const { reports, loading, error, decide, deciding } = useEngineeringReports("all");
  const [tab, setTab] = useState<DecisionTab>("pending");

  const filtered = useMemo(() => {
    if (tab === "pending") return reports.filter((r) => PENDING_STATUSES.includes(r.status));
    if (tab === "approved") return reports.filter((r) => r.status === "Approved");
    return reports.filter((r) => r.status === "Rejected" || r.status === "Revision Required");
  }, [reports, tab]);

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description="Engineering reports awaiting a decision — including Final Inspection, which Closeout needs Approved before it can complete."
      />
      <PageContent className="space-y-4 p-6 md:p-8">
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error.message}
          </p>
        )}

        {!canDecide && (
          <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Read-only — only the Project Manager or Admin can decide on a report here.
          </p>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as DecisionTab)}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg">Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg">Rejected / Revision</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading reports…</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                No reports in this bucket.
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((r) => (
                  <div key={r.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                        <span className="ml-2 text-sm font-medium">{r.title}</span>
                        {r.type === "Final Inspection" && (
                          <Badge variant="outline" className="ml-2 rounded-full border-primary/30 text-[10px] text-primary">
                            Final Inspection
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={r.priority} />
                        <ReportStatusBadge status={r.status} />
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{r.project}</span>
                      <span>·</span>
                      <span>{r.location}</span>
                      <span>·</span>
                      <span>{r.engineer}</span>
                      <span>·</span>
                      <span>{r.updatedAgo}</span>
                    </div>
                    {r.findings && (
                      <p className="mt-2 text-xs text-muted-foreground">{r.findings}</p>
                    )}
                    {canDecide && tab === "pending" && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 rounded-lg text-xs"
                          disabled={deciding === r.dbId}
                          onClick={() => void decide(r.dbId, "Approved")}
                        >
                          <Check className="h-3 w-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-lg text-xs"
                          disabled={deciding === r.dbId}
                          onClick={() => void decide(r.dbId, "Revision Required")}
                        >
                          <PenLine className="h-3 w-3" /> Request revision
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-lg text-xs text-destructive"
                          disabled={deciding === r.dbId}
                          onClick={() => void decide(r.dbId, "Rejected")}
                        >
                          <X className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}

SharedReportsPage.displayName = "SharedReportsPage";
