import { useEffect, useState } from "react";

import {
  decidePayrollReview,
  listPayrollReview,
  type PayrollReviewBatch,
} from "@/features/finance/apis/payroll-review-api";
import { useAuth } from "@/auth/auth-context";

export default function FinancePayrollReviewPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<PayrollReviewBatch[]>([]);
  const [selectedBatch, setSelectedBatch] =
    useState<PayrollReviewBatch | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [comment, setComment] = useState("");

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

  async function handleDecision(
    decision: "approved" | "rejected",
  ) {
    if (!selectedBatch) return;

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
      <div>
        <h1 className="text-2xl font-semibold">
          Payroll Review
        </h1>

        <p className="text-sm text-muted-foreground">
          Review payroll batches submitted by Human Resources.
        </p>
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
              {batches.map((batch) => (
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
                      ₱
                      {Number(
                        selectedBatch.grossPayroll,
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Deductions
                    </p>
                    <p className="font-medium">
                      ₱
                      {Number(
                        selectedBatch.deductions,
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Net Payroll
                    </p>
                    <p className="text-xl font-semibold">
                      ₱
                      {Number(
                        selectedBatch.netPayroll,
                      ).toLocaleString()}
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

                  {selectedBatch.status === "pending" && (
                    <>
                      <div>
                        <label
                          htmlFor="payroll-comment"
                          className="text-sm font-medium"
                        >
                          Review Comment
                        </label>

                        <textarea
                          id="payroll-comment"
                          value={comment}
                          onChange={(event) =>
                            setComment(event.target.value)
                          }
                          placeholder="Optional comment..."
                          className="mt-2 min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={processing}
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