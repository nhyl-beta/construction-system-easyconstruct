// H6: closeout-summary — documents, budgets planned-vs-actual, payroll and
// the closeout workflow's status, in one place instead of four screens.
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { LifecycleRepository } from "../repositories/lifecycle.repository";
import type { CloseoutSummary } from "../types/lifecycle.types";
import { formatCompactCurrency } from "@/lib/format-currency";

function DocRow({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {present ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className={present ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

export function CloseoutSummaryCard({ projectId }: { projectId: string | number }) {
  const [summary, setSummary] = useState<CloseoutSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    LifecycleRepository.getCloseoutSummary(projectId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading closeout summary…</p>;
  }
  if (!summary) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Closeout summary</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <DocRow label="Certificate of Completion on file" present={summary.documents.certificateOfCompletion} />
          <DocRow label="As-Built Drawing on file" present={summary.documents.asBuiltDrawing} />
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            Payroll: {summary.payroll.pending > 0 ? `${summary.payroll.pending} pending` : "none pending"}
            {summary.payroll.approvedSinceCloseout > 0
              ? `, ${summary.payroll.approvedSinceCloseout} approved since Closeout`
              : ""}
          </p>
          <p>
            Closeout workflow:{" "}
            {summary.closeoutWorkflow
              ? summary.closeoutWorkflow.status === "completed"
                ? "completed"
                : `awaiting ${summary.closeoutWorkflow.currentStageRoleLabel ?? "next stage"}`
              : "not started"}
          </p>
        </div>
      </div>

      {summary.budgets.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border/50">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 text-left">Category</th>
                <th className="px-2 py-1.5 text-right">Planned</th>
                <th className="px-2 py-1.5 text-right">Actual</th>
                <th className="px-2 py-1.5 text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {summary.budgets.map((b) => (
                <tr key={b.category} className="border-t border-border/40">
                  <td className="px-2 py-1.5">{b.category}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatCompactCurrency(b.planned)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatCompactCurrency(b.spent)}</td>
                  <td
                    className={`px-2 py-1.5 text-right tabular-nums ${
                      b.spent > b.planned ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {formatCompactCurrency(b.planned - b.spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

CloseoutSummaryCard.displayName = "CloseoutSummaryCard";
