import { PageHeader } from "@/components/refine-ui/views/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { GitBranch } from "lucide-react";
import { useDesignRevisions } from "@/features/designs/hooks/useDesignRevisions.js";

export default function ArchitectRevisions() {
  const c = useDesignRevisions();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader title="Revisions" description="Version history across every design." />

      {c.loading ? (
        <div className="text-sm text-muted-foreground">Loading revisions…</div>
      ) : c.revisions.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No revisions recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {[...c.revisions]
            .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
            .map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-xl border p-3">
                <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      Design #{r.designId} · {r.version}
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Branched from {r.parentVersion ?? "—"} · {r.createdBy}
                  </div>
                  {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

ArchitectRevisions.displayName = "ArchitectRevisions";