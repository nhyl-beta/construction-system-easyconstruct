export type PayrollReviewStatus =
  | "pending"
  | "approved"
  | "revision_required";

export interface PayrollReviewBatch {
  id: string;
  projectCode?: string | null;
  period: string;
  group: string;
  employees: number;
  overtimeHours: number;
  grossPayroll: number | string;
  deductions: number | string;
  netPayroll: number | string;
  status: PayrollReviewStatus | string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  round?: number;
  employerCost?: number | string;
  submittedAt?: string | null;
  createdAt?: string | null;
}

export type PayrollReviewDecision = "approved" | "rejected";

// The reviewer is the signed-in user, taken from the session on the server.
export interface DecidePayrollReviewPayload {
  decision: PayrollReviewDecision;
  reasonCode?: string;
  comment?: string;
}

const BASE_PATH = "/finance/payroll-review";

// The shared client unwraps authentication and preserves the backend envelope.
async function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  const response = await promise;

  if (
    response &&
    typeof response === "object" &&
    "data" in response
  ) {
    return (response as { data: T }).data;
  }

  return response as T;
}

export async function listPayrollReview(): Promise<
  PayrollReviewBatch[]
> {
  return unwrap<PayrollReviewBatch[]>(
    apiClient.get(BASE_PATH),
  );
}

export async function getPayrollReview(
  id: string,
): Promise<PayrollReviewBatch> {
  return unwrap<PayrollReviewBatch>(
    apiClient.get(
      `${BASE_PATH}/${encodeURIComponent(id)}`,
    ),
  );
}

export async function decidePayrollReview(
  id: string,
  payload: DecidePayrollReviewPayload,
): Promise<PayrollReviewBatch> {
  return unwrap<PayrollReviewBatch>(
    apiClient.post(
      `${BASE_PATH}/${encodeURIComponent(id)}/decide`,
      payload,
    ),
  );
}
import { apiClient } from "@/services/api.client";
