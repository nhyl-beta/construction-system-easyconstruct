import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevisionRepository } from "../repositories/revision.repository";
import type { Revision, RevisionItemType } from "../types/revision.types";
import { ItemTypeBadge, RevisionStatusBadge } from "./RevisionBadges";
import { formatDateTime, versionText } from "../lib/revision-format";
import { VersionHistorySheet } from "./VersionHistorySheet";

/**
 * The current version of every tracked item on one project, for the Project
 * Manager / Consultant / Architect on the project page. Opens the same history
 * drawer as the Revisions page; reviewers (Consultant, PM, Admin) can decide
 * the current version there, everyone else just reads and downloads.
 */
export function ProjectRevisionsCard({ projectCode }: { projectCode: string }) {
  const [rows, setRows] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<{ itemType: RevisionItemType; itemId: number } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    RevisionRepository.list({ project: projectCode, currentOnly: true }, { page: 1, pageSize: 50 })
      .then((page) => {
        if (!cancelled) setRows(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load revisions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectCode, tick]);

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" /> Revisions
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          The latest version of each design, drawing and plan on this project, with its review status.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-5 text-sm text-muted-foreground">Loading revisions…</div>
        ) : error ? (
          <div role="alert" className="flex items-center justify-between gap-3 p-5 text-sm text-destructive">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => setTick((n) => n + 1)}>
              Retry
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">No revisions have been recorded on this project yet.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpen({ itemType: r.itemType, itemId: r.itemId })}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{r.itemTitle}</span>
                      <ItemTypeBadge type={r.itemType} />
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.changeSummary}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {versionText(r)} · {r.createdBy} · {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <RevisionStatusBadge status={r.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <VersionHistorySheet item={open} onOpenChange={(o) => !o && setOpen(null)} onChanged={() => setTick((n) => n + 1)} />
    </Card>
  );
}
