import { useEffect, useMemo, useState } from "react";

import {
  decidePayrollReview,
  listPayrollReview,
  type PayrollReviewBatch,
} from "@/features/finance/apis/payroll-review-api";
import {
  getBatchDetail,
  reasonLabel,
  REJECTION_REASONS,
  type BatchDetail,
  type PayrollLine,
} from "@/features/hr/payroll-api";
import { BatchStatusPill } from "@/features/hr/components/batch-status-pill";
import { PayslipDialog } from "@/features/hr/components/payslip-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

export default function FinancePayrollReviewPage() {
  const [batches, setBatches] = useState<PayrollReviewBatch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState("");
  const [comment, setComment] = useState("");
  const [confirming, setConfirming] = useState<"approved" | "rejected" | null>(null);
  const [payslipLine, setPayslipLine] = useState<PayrollLine | null>(null);

  async function loadBatches() {
    try {
      setLoading(true);
      setError("");
      setBatches(await listPayrollReview());
    } catch (err) {
      console.error(err);
      setError("Failed to load payroll batches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    getBatchDetail(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const periods = useMemo(
    () => Array.from(new Set(batches.map((b) => b.period))).sort().reverse(),
    [batches],
  );
  const filteredBatches = useMemo(
    () => (periodFilter ? batches.filter((b) => b.period === periodFilter) : batches),
    [batches, periodFilter],
  );
  const pagination = usePagination(filteredBatches, 10);
  const linePagination = usePagination(detail?.lines ?? [], 8);

  const batch = detail?.batch ?? null;
  const t = detail?.totals;
  const pending = batch?.status === "pending";
  // Reject needs a reason, and a comment when the reason is Other.
  const rejectReady = reasonCode !== "" && (reasonCode !== "other" || comment.trim() !== "");

  async function handleDecision(decision: "approved" | "rejected") {
    if (!batch) return;
    try {
      setProcessing(true);
      setError("");
      await decidePayrollReview(batch.id, {
        decision,
        reasonCode: decision === "rejected" ? reasonCode : undefined,
        comment: comment.trim() || undefined,
      });
      setConfirming(null);
      setReasonCode("");
      setComment("");
      await loadBatches();
      setDetail(await getBatchDetail(batch.id));
    } catch (err) {
      // A stale tab deciding an already-decided batch gets the server's 409
      // text here; reload so the buttons disable.
      setConfirming(null);
      setError(err instanceof Error ? err.message : "Failed to update payroll decision.");
      await loadBatches();
      setDetail(await getBatchDetail(batch.id).catch(() => detail));
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Payroll Review</h1>
        <p className="mt-2 text-muted-foreground">Loading payroll batches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Payroll Review</h1>
          <p className="text-sm text-muted-foreground">Review payroll batches submitted by Human Resources.</p>
        </div>

        <Select value={periodFilter ?? ALL} onValueChange={(v) => setPeriodFilter(v === ALL ? null : v)}>
          <SelectTrigger className="h-9 w-44 rounded-xl text-xs">
            <SelectValue placeholder="All periods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All periods</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {batches.length === 0 ? (
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground">No payroll batches are currently available for review.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_480px]">
          <div className="rounded-lg border">
            <div className="border-b p-4">
              <h2 className="font-semibold">Payroll Batches</h2>
            </div>
            <div className="divide-y">
              {pagination.pageItems.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedId(b.id)}
                  className={`w-full p-4 text-left transition hover:bg-muted ${selectedId === b.id ? "bg-muted" : ""}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{b.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.period} · {b.projectCode ?? "All projects"}
                      </p>
                      <p className="text-sm text-muted-foreground">{b.group}</p>
                    </div>
                    <BatchStatusPill status={b.status} />
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t p-2">
              <DataTablePagination {...pagination} />
            </div>
          </div>

          <div className="rounded-lg border">
            {!selectedId ? (
              <div className="p-6">
                <p className="text-sm text-muted-foreground">Select a payroll batch to review.</p>
              </div>
            ) : detailLoading || !batch || !t || !detail ? (
              <div className="p-6">
                <p className="text-sm text-muted-foreground">Loading batch…</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between border-b p-4">
                  <div>
                    <h2 className="font-semibold">Payroll Details</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {batch.id} · round {batch.round}
                    </p>
                  </div>
                  <BatchStatusPill status={batch.status} />
                </div>

                <div className="space-y-5 p-4">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Project</p>
                      <p className="font-medium">{batch.projectCode || "All Projects"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Period</p>
                      <p className="font-medium">{batch.period}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Employees</p>
                      <p className="font-medium">{batch.employees}</p>
                    </div>
                  </div>

                  <section className="rounded-xl border p-3">
                    <Figure label="Gross payroll" value={formatCurrency(t.gross)} strong />
                    <div className="my-1 border-t" />
                    <p className="text-xs font-medium text-muted-foreground">Employee deductions</p>
                    <Figure label="SSS" value={formatCurrency(t.sss)} />
                    <Figure label="PhilHealth" value={formatCurrency(t.philhealth)} />
                    <Figure label="Pag-IBIG" value={formatCurrency(t.pagibig)} />
                    <Figure label="Withholding tax" value={formatCurrency(t.withholdingTax)} />
                    <Figure label="Total deductions" value={formatCurrency(t.deductions)} strong />
                    <div className="my-1 border-t" />
                    <Figure label="Net payroll" value={formatCurrency(t.net)} strong />
                  </section>

                  <section className="rounded-xl border p-3">
                    <p className="text-xs font-medium text-muted-foreground">Employer contributions</p>
                    <Figure label="SSS" value={formatCurrency(t.employerSss)} />
                    <Figure label="EC" value={formatCurrency(t.employerEc)} />
                    <Figure label="PhilHealth" value={formatCurrency(t.employerPhilhealth)} />
                    <Figure label="Pag-IBIG" value={formatCurrency(t.employerPagibig)} />
                    <Figure
                      label="Total employer contributions"
                      value={formatCurrency(t.employerEc + t.employerSss + t.employerPhilhealth + t.employerPagibig)}
                      strong
                    />
                    <div className="my-1 border-t" />
                    <Figure label="Total employer cost" value={formatCurrency(t.employerCost)} strong />
                  </section>

                  <p className="text-xs text-muted-foreground">
                    Rate versions:{" "}
                    {Object.entries(detail.rateVersions)
                      .filter(([k]) => k !== "overtime")
                      .map(([k, v]) => `${k} ${v}`)
                      .join(" · ")}
                    {detail.needsVerification.length > 0 &&
                      ` · needs verification: ${detail.needsVerification.join("; ")}`}
                  </p>

                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Per-employee lines</p>
                    <div className="rounded-lg border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="px-2 py-1.5 text-left">Employee</th>
                            <th className="px-2 py-1.5 text-right">Hours</th>
                            <th className="px-2 py-1.5 text-right">Gross</th>
                            <th className="px-2 py-1.5 text-right">Net</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {linePagination.pageItems.map((line) => (
                            <tr key={line.id} className="border-t">
                              <td className="px-2 py-1.5">{line.name}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">
                                {line.hours}
                                {line.overtime ? ` + ${line.overtime} OT` : ""}
                              </td>
                              <td className="px-2 py-1.5 text-right tabular-nums">{formatCurrency(line.gross)}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">{formatCurrency(line.net)}</td>
                              <td className="px-2 py-1.5 text-right">
                                <button
                                  type="button"
                                  className="text-primary underline"
                                  onClick={() => setPayslipLine(line)}
                                >
                                  Payslip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="pt-2">
                      <DataTablePagination {...linePagination} />
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Decision history</p>
                    {detail.decisions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No decisions yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {detail.decisions.map((d) => (
                          <li key={d.id} className="rounded-lg border p-2 text-xs">
                            <div className="font-medium">
                              Round {d.round}: {d.action === "approved" ? "Approved" : "Rejected"} by {d.decidedBy}
                            </div>
                            <div className="text-muted-foreground">{new Date(d.decidedAt).toLocaleString()}</div>
                            {d.reasonCode && <div>Reason: {reasonLabel(d.reasonCode)}</div>}
                            {d.comment && <div>{d.comment}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Finance has no edit controls on lines — only the decision. */}
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <label className="text-sm font-medium">Rejection reason</label>
                      <Select value={reasonCode} onValueChange={setReasonCode} disabled={!pending}>
                        <SelectTrigger className="mt-1 h-9 text-xs">
                          <SelectValue placeholder="Required to reject" />
                        </SelectTrigger>
                        <SelectContent>
                          {REJECTION_REASONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="payroll-comment" className="text-sm font-medium">
                        Comment{" "}
                        <span className="font-normal text-muted-foreground">
                          (required when the reason is Other)
                        </span>
                      </label>
                      <textarea
                        id="payroll-comment"
                        value={comment}
                        disabled={!pending}
                        onChange={(event) => setComment(event.target.value)}
                        className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 disabled:opacity-50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!pending || processing || !rejectReady}
                        title={!pending ? `Batch is ${batch.status}` : !rejectReady ? "Choose a reason (and a comment for Other)" : undefined}
                        onClick={() => setConfirming("rejected")}
                        className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={!pending || processing}
                        title={!pending ? `Batch is ${batch.status}` : undefined}
                        onClick={() => setConfirming("approved")}
                        className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve Payroll
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={confirming === "approved" ? "Approve this payroll batch?" : "Send this batch back to HR?"}
        description={
          confirming === "approved"
            ? "Approving locks the batch and books its total employer cost against the project's Labor budget."
            : `HR will see the reason (${reasonLabel(reasonCode)}) and can correct and resubmit.`
        }
        confirmLabel={confirming === "approved" ? "Approve" : "Reject"}
        destructive={confirming === "rejected"}
        loading={processing}
        onConfirm={() => confirming && void handleDecision(confirming)}
      />

      <PayslipDialog line={payslipLine} onClose={() => setPayslipLine(null)} />
    </div>
  );
}
