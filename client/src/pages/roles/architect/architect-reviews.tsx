import { PageHeader } from "@/components/refine-ui/views/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Send } from "lucide-react";
import { useDesignReviews } from "@/features/design-reviews/hooks/useDesignReviews";

export default function ArchitectReviews() {
  const c = useDesignReviews();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader title="Review queue" description="Design reviews awaiting action." />

      <Tabs value={c.tab} onValueChange={(v) => c.setTab(v as typeof c.tab)}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={c.tab} className="mt-4">
          {c.loading ? (
            <div className="text-sm text-muted-foreground">Loading reviews…</div>
          ) : c.filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No reviews in this bucket.
            </div>
          ) : (
            <div className="space-y-2">
              {c.filtered.map((r) => (
                <div key={r.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                      <span className="ml-2 text-sm font-medium">Design #{r.designId}</span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{r.discipline ?? "—"}</span>
                    <span>·</span>
                    <span>{r.reviewers ?? "Unassigned"}</span>
                    <span>·</span>
                    <span>Due {r.dueDate ?? "—"}</span>
                  </div>
                  {c.tab === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" className="h-7 rounded-lg text-xs" onClick={() => c.decide(r.id, "Approved")}>
                        <Check className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => c.decide(r.id, "Changes Requested")}>
                        <Send className="h-3 w-3" /> Request changes
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs text-destructive" onClick={() => c.decide(r.id, "Rejected")}>
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
    </div>
  );
}

ArchitectReviews.displayName = "ArchitectReviews";