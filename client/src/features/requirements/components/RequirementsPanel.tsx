import { Check, ClipboardList, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectRequirements } from "../hooks/useProjectRequirements";

const STATUS_TONE: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  "Under Review": "bg-warning/15 text-warning border-warning/30",
  Approved: "bg-success/10 text-success border-success/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

/**
 * F1: the PM's view of a project's requirements, with Approve/Reject —
 * there was no such screen at all before this; Engineer could only draft
 * and submit for review (engineer-requirements.tsx), with nobody able to
 * decide. `canDecide` gates the buttons; the server enforces the same rule
 * independently (requirements/service.ts assertCanSetStatus).
 */
export function RequirementsPanel({
  projectCode,
  canDecide,
}: {
  projectCode: string;
  canDecide: boolean;
}) {
  const { requirements, loading, error, decidingId, decide } = useProjectRequirements(projectCode);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Requirements
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {canDecide
            ? "Materials and Specifications requirements need your decision before Pre-Construction can pass."
            : "Requirements drafted for this project."}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : requirements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requirements drafted yet.</p>
      ) : (
        <ul className="space-y-2">
          {requirements.map((r) => (
            <li key={r.dbId} className="space-y-1.5 rounded-xl border border-border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-muted-foreground">
                    {r.id} · {r.category}
                  </div>
                  <div className="text-sm font-medium">{r.title}</div>
                </div>
                <Badge variant="outline" className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] ${STATUS_TONE[r.status] ?? ""}`}>
                  {r.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              {canDecide && (r.status === "Draft" || r.status === "Under Review") && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-7 rounded-lg text-xs"
                    disabled={decidingId === r.dbId}
                    onClick={() => void decide(r.dbId, "Approved")}
                  >
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg text-xs text-destructive"
                    disabled={decidingId === r.dbId}
                    onClick={() => void decide(r.dbId, "Rejected")}
                  >
                    <X className="h-3 w-3" /> Reject
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

RequirementsPanel.displayName = "RequirementsPanel";
