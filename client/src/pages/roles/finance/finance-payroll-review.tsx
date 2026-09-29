import { useEffect, useMemo, useState } from "react";

import {
  decidePayrollReview,
  listPayrollReview,
  type PayrollReviewBatch,
} from "@/features/finance/apis/payroll-review-api";
import { listPayroll, type PayrollLine } from "@/features/hr/payroll-api";
import { useAuth } from "@/auth/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTablePagination } from "@/components/refine-ui/data-table/data-table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { formatCurrency } from "@/lib/format-currency";

const ALL = "all";

export default function FinancePayrollReviewPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<PayrollReviewBatch[]>([]);
  const [selectedBatch, setSelectedBatch] =
    useState<PayrollReviewBatch | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [comment, setComment] = useState("");

  // G1: per-employee lines for the selected batch's period. payroll lines
  // aren't linked to a batch id (only a period string — see
  // server/src/db/schema/payroll.ts), so if more than one batch was ever
  // generated for the same period, this shows every line for that period,
  // not strictly this one batch's lines. Flagged rather than silently wrong:
  // a mismatch between the line count and the batch's own `employees` count
  // is called out in the UI instead of presented as an exact match.
  const [batchLines, setBatchLines] = useState<PayrollLine[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);

  const [periodFilter, setPeriodFilter] = useState<string | null>(null);

  async function loadPayroll() {
    try {
      setLoading(true);
      setError("");

      const data = await listPayrollReview();

      setBatches(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load payroll batches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayroll();
  }, []);

  useEffect(() => {
    if (!selectedBatch) {
      setBatchLines([]);
      return;
    }
    let cancelled = false;
    setLinesLoading(true);
    listPayroll(selectedBatch.period)
      .then((lines) => {
        if (!cancelled) setBatchLines(lines);
      })
      .catch(() => {
        if (!cancelled) setBatchLines([]);
      })
      .finally(() => {
        if (!cancelled) setLinesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBatch]);

  const periods = useMemo(
    () => Array.from(new Set(batches.map((b) => b.period))).sort().reverse(),
    [batches],
  );

  const filteredBatches = useMemo(
    () => (periodFilter ? batches.filter((b) => b.period === periodFilter) : batches),
    [batches, periodFilter],
  );

  const pagination = usePagination(filteredBatches, 10);

  async function handleDecision(
    decision: "approved" | "rejected",
  ) {
    if (!selectedBatch) return;
    if (decision === "rejected" && !comment.trim()) return;

    try {
      setProcessing(true);
      setError("");

      const updated = await decidePayrollReview(selectedBatch.id, {
        decision,
        reviewedBy: user?.name ?? "Finance Manager",
        comment: comment.trim() || undefined,
      });

      setBatches((current) =>
        current.map((batch) =>
          batch.id === updated.id ? updated : batch,
        ),
      );

      setSelectedBatch(updated);
      setComment("");
    } catch (err) {
      console.error(err);
      setError("Failed to update payroll decision.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Payroll Review</h1>
        <p className="mt-2 text-muted-foreground">
          Loading payroll batches...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Payroll Review
          </h1>

          <p className="text-sm text-muted-foreground">
            Review payroll batches submitted by Human Resources.
          </p>
        </div>

        <Select value={periodFilter ?? ALL} onValueChange={(v) => setPeriodFilter(v === ALL ? null : v)}>
          <SelectTrigger className="h-9 w-44 rounded-xl text-xs">
            <SelectValue placeholder="All periods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All periods</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {batches.length === 0 ? (
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground">
            No payroll batches are currently available for review.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-lg border">
            <div className="border-b p-4">
              <h2 className="font-semibold">
                Payroll Batches
              </h2>
            </div>

            <div className="divide-y">
              {pagination.pageItems.map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => setSelectedBatch(batch)}
                  className={`w-full p-4 text-left transition hover:bg-muted ${
                    selectedBatch?.id === batch.id
                      ? "bg-muted"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {batch.id}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {batch.period}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {batch.group}
                      </p>
                    </div>

                    <span className="rounded-full border px-3 py-1 text-xs font-medium">
                      {batch.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t p-2">
              <DataTablePagination {...pagination} />
            </div>
          </div>

          <div className="rounded-lg border">
            {!selectedBatch ? (
              <div className="p-6">
                <p className="text-sm text-muted-foreground">
                  Select a payroll batch to review.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b p-4">
                  <h2 className="font-semibold">
                    Payroll Details
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedBatch.id}
                  </p>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Project
                    </p>
                    <p className="font-medium">
                      {selectedBatch.projectCode || "All Projects"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Period
                    </p>
                    <p className="font-medium">
                      {selectedBatch.period}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Employee Count
                    </p>
                    <p className="font-medium">
                      {selectedBatch.employees}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Overtime Hours
                    </p>
                    <p className="font-medium">
                      {selectedBatch.overtimeHours}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Gross Payroll
                    </p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(Number(selectedBatch.grossPayroll))}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Deductions
                    </p>
                    <p className="font-medium">
                      {formatCurrency(Number(selectedBatch.deductions))}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Net Payroll
                    </p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(Number(selectedBatch.netPayroll))}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Status
                    </p>

                    <span className="inline-flex rounded-full border px-3 py-1 text-sm font-medium">
                      {selectedBatch.status}
                    </span>
                  </div>

                  {/* G1: per-employee breakdown, matching HR's own tracksheet
                      instead of only batch-level totals. */}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Per-employee breakdown
                    </p>
                    {linesLoading ? (
                      <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
                    ) : batchLines.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">No lines found for this period.</p>
                    ) : (
                      <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-muted/60">
                            <tr>
                              <th className="px-2 py-1.5 text-left">Employee</th>
                              <th className="px-2 py-1.5 text-right">Hours</th>
                              <th className="px-2 py-1.5 text-right">Net</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchLines.map((line) => (
                              <tr key={line.id} className="border-t">
                                <td className="px-2 py-1.5">{line.name}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums">{line.hours}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums">{formatCurrency(line.net)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {batchLines.length !== selectedBatch.employees && (
                          <p className="border-t bg-warning/10 px-2 py-1.5 text-[11px] text-warning">
                            {batchLines.length} line(s) found for period {selectedBatch.period}, batch reports {selectedBatch.employees} — another batch may share this period.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedBatch.reviewedBy && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Reviewed By
                      </p>

                      <p className="font-medium">
                        {selectedBatch.reviewedBy}
                      </p>
                    </div>
                  )}

                  {selectedBatch.reviewedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Reviewed At
                      </p>

                      <p className="text-sm">
                        {new Date(
                          selectedBatch.reviewedAt,
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedBatch.reviewNote && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {selectedBatch.status === "rejected" ? "Rejection reason" : "Review note"}
                      </p>
                      <p className="text-sm">{selectedBatch.reviewNote}</p>
                    </div>
                  )}

                  {selectedBatch.status === "pending" && (
                    <>
                      <div>
                        <label
                          htmlFor="payroll-comment"
                          className="text-sm font-medium"
                        >
                          Review comment <span className="font-normal text-muted-foreground">(required to reject)</span>
                        </label>

                        <textarea
                          id="payroll-comment"
                          value={comment}
                          onChange={(event) =>
                            setComment(event.target.value)
                          }
                          placeholder="Optional when approving; required when rejecting"
                          className="mt-2 min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={processing || !comment.trim()}
                          title={!comment.trim() ? "Enter a reason before rejecting" : undefined}
                          onClick={() =>
                            void handleDecision("rejected")
                          }
                          className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processing
                            ? "Processing..."
                            : "Reject"}
                        </button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() =>
                            void handleDecision("approved")
                          }
                          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processing
                            ? "Processing..."
                            : "Approve Payroll"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
