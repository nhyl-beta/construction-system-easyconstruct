import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Check,
  FileText,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/services/api.client";

/*
 * ============================================================
 * PROPOSAL TYPE
 * ============================================================
 */

type Proposal = {
  id: number;

  proposalId: string;

  title: string;

  projectCode: string;

  submittedBy: string;

  assignedReviewer?: string | null;

  status: string;

  amount?: string | null;

  content?: string | null;

  aiValidation?: string | null;

  reviewerName?: string | null;

  reviewComment?: string | null;

  reviewedAt?: string | null;

  createdAt?: string | null;

  updatedAt?: string | null;
};

/*
 * ============================================================
 * REVIEW STATUS
 * ============================================================
 */

type ReviewStatus =
  | "Approved"
  | "Revision Requested"
  | "Rejected";

/*
 * ============================================================
 * CONSULTANT PROPOSALS PAGE
 * ============================================================
 */

export default function ConsultantProposalsPage() {
  /*
   * ----------------------------------------------------------
   * STATE
   * ----------------------------------------------------------
   */

  const [proposals, setProposals] =
    useState<Proposal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedProposal, setSelectedProposal] =
    useState<Proposal | null>(null);

  const [comment, setComment] =
    useState("");

  const [reviewing, setReviewing] =
    useState(false);

  /*
   * ----------------------------------------------------------
   * LOAD PROPOSALS
   * ----------------------------------------------------------
   */

  const loadProposals = async () => {
    try {
      setLoading(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await apiClient.get("/proposals");

      setProposals(
        Array.isArray(result?.data)
          ? result.data
          : [],
      );
    } catch (error) {
      console.error(
        "Failed to load proposals:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------------------------
   * INITIAL LOAD
   * ----------------------------------------------------------
   */

  useEffect(() => {
    loadProposals();
  }, []);

  /*
   * ----------------------------------------------------------
   * FILTER CONSULTANT PROPOSALS
   * ----------------------------------------------------------
   *
   * A proposal appears if:
   *
   * 1. It is Pending
   * 2. It is assigned to Consultant
   *
   * OR
   *
   * 3. It is an older Architect proposal that does not
   *    have assignedReviewer yet.
   *
   */

  const pendingProposals =
    proposals.filter((proposal) => {
      /*
       * Only pending proposals require review.
       */

      if (
        proposal.status
          ?.trim()
          .toLowerCase() !==
        "pending"
      ) {
        return false;
      }

      /*
       * Normalize assigned reviewer.
       */

      const assignedReviewer =
        proposal.assignedReviewer
          ?.trim()
          .toLowerCase();

      /*
       * New proposal:
       *
       * assignedReviewer = consultant
       */

      if (
        assignedReviewer ===
        "consultant"
      ) {
        return true;
      }

      /*
       * Legacy proposal:
       *
       * submittedBy = Architect
       * assignedReviewer = empty
       */

      const submittedBy =
        proposal.submittedBy
          ?.trim()
          .toLowerCase();

      if (
        !assignedReviewer &&
        submittedBy === "architect"
      ) {
        return true;
      }

      return false;
    });

  /*
   * ----------------------------------------------------------
   * OPEN PROPOSAL
   * ----------------------------------------------------------
   */

  const openProposal = (
    proposal: Proposal,
  ) => {
    /*
     * This is the important state change.
     *
     * Once this is not null, the page below will render
     * the review screen.
     */

    setSelectedProposal(proposal);

    /*
     * Load an existing comment if there is one.
     */

    setComment(
      proposal.reviewComment ?? "",
    );
  };

  /*
   * ----------------------------------------------------------
   * CLOSE PROPOSAL
   * ----------------------------------------------------------
   */

  const closeProposal = () => {
    setSelectedProposal(null);

    setComment("");
  };

  /*
   * ----------------------------------------------------------
   * REVIEW PROPOSAL
   * ----------------------------------------------------------
   */

  const reviewProposal = async (
    proposal: Proposal,
    status: ReviewStatus,
  ) => {
    /*
     * Require a comment.
     */

    if (!comment.trim()) {
      alert(
        "Please enter a review comment before submitting your decision.",
      );

      return;
    }

    try {
      setReviewing(true);

      await apiClient.patch(
        `/proposals/${proposal.id}/review`,
        {
          status,

          reviewerName:
            "Consultant",

          reviewComment:
            comment.trim(),
        },
      );

      /*
       * Clear the review.
       */

      setComment("");

      /*
       * Return to proposal list.
       */

      setSelectedProposal(null);

      /*
       * Reload the database data.
       */

      await loadProposals();

      alert(
        `Proposal ${status.toLowerCase()} successfully.`,
      );
    } catch (error) {
      console.error(
        "FAILED TO SUBMIT REVIEW:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit the proposal review.",
      );
    } finally {
      setReviewing(false);
    }
  };

  /*
   * ==========================================================
   * REVIEW SCREEN
   * ==========================================================
   *
   * THIS IS THE MOST IMPORTANT PART.
   *
   * If selectedProposal exists, the proposal list disappears
   * and the Consultant Review interface appears.
   */

  if (selectedProposal) {
    return (
      <PageContainer>

        <PageHeader
          title="Proposal Review"
          description="Review the proposal and submit your professional assessment."
        />

        <PageContent className="p-6 md:p-8">

          <div className="mx-auto max-w-4xl space-y-6">

            {/* ------------------------------------------------
                BACK BUTTON
                ------------------------------------------------ */}

            <Button
              type="button"
              variant="ghost"
              onClick={closeProposal}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to Proposals
            </Button>

            {/* ------------------------------------------------
                PROPOSAL INFORMATION
                ------------------------------------------------ */}

            <div className="rounded-xl border bg-card">

              <div className="border-b p-6">

                <div className="flex flex-wrap items-start justify-between gap-4">

                  <div>

                    <p className="font-mono text-xs text-muted-foreground">
                      {
                        selectedProposal.proposalId
                      }
                    </p>

                    <h1 className="mt-2 text-2xl font-bold">
                      {
                        selectedProposal.title
                      }
                    </h1>

                  </div>

                  <StatusBadge
                    status={
                      selectedProposal.status
                    }
                  />

                </div>

              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">

                {/* Project */}

                <div>

                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Project
                  </p>

                  <p className="mt-1 font-medium">
                    {
                      selectedProposal.projectCode
                    }
                  </p>

                </div>

                {/* Submitted By */}

                <div>

                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Submitted By
                  </p>

                  <p className="mt-1 font-medium">
                    {
                      selectedProposal.submittedBy
                    }
                  </p>

                </div>

                {/* Amount */}

                <div>

                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Estimated Amount
                  </p>

                  <p className="mt-1 font-medium">
                    {
                      selectedProposal.amount ??
                      "Not provided"
                    }
                  </p>

                </div>

                {/* Reviewer */}

                <div>

                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Assigned Reviewer
                  </p>

                  <p className="mt-1 font-medium">
                    {
                      selectedProposal.assignedReviewer ??
                      "Consultant"
                    }
                  </p>

                </div>

              </div>

            </div>

            {/* ------------------------------------------------
                PROPOSAL DESCRIPTION
                ------------------------------------------------ */}

            <div className="rounded-xl border bg-card">

              <div className="border-b p-6">

                <h2 className="font-semibold">
                  Proposal Details
                </h2>

              </div>

              <div className="p-6">

                {selectedProposal.content ? (
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {
                      selectedProposal.content
                    }
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No proposal description was
                    provided.
                  </p>
                )}

              </div>

            </div>

            {/* ------------------------------------------------
                RULE-BASED VALIDATION
                ------------------------------------------------ */}

            <div className="rounded-xl border bg-card">

              <div className="border-b p-6">

                <h2 className="font-semibold">
                  Rule-Based Validation Summary
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Automated, deterministic checks run at submission time —
                  decision support only. This does not replace your
                  professional judgment or approve/reject anything itself.
                </p>

              </div>

              <div className="p-6">
                {(() => {
                  if (!selectedProposal.aiValidation) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        No validation summary is available for this proposal.
                      </p>
                    );
                  }
                  let parsed: { passed: boolean; issues: string[]; warnings: string[] } | null = null;
                  try {
                    parsed = JSON.parse(selectedProposal.aiValidation);
                  } catch {
                    parsed = null;
                  }
                  if (!parsed) {
                    return (
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {selectedProposal.aiValidation}
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-3 text-sm">
                      <div className={`font-medium ${parsed.passed ? "text-success" : "text-destructive"}`}>
                        {parsed.passed ? "No blocking issues found" : "Blocking issues found"}
                      </div>
                      {parsed.issues.length > 0 && (
                        <div>
                          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Issues</p>
                          <ul className="list-inside list-disc space-y-0.5 text-destructive">
                            {parsed.issues.map((i) => <li key={i}>{i}</li>)}
                          </ul>
                        </div>
                      )}
                      {parsed.warnings.length > 0 && (
                        <div>
                          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Warnings</p>
                          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                            {parsed.warnings.map((w) => <li key={w}>{w}</li>)}
                          </ul>
                        </div>
                      )}
                      {parsed.issues.length === 0 && parsed.warnings.length === 0 && (
                        <p className="text-muted-foreground">No issues or warnings raised.</p>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* ------------------------------------------------
                CONSULTANT REVIEW
                ------------------------------------------------ */}

            <div className="rounded-xl border bg-card">

              <div className="border-b p-6">

                <h2 className="font-semibold">
                  Consultant Review
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Provide your professional assessment
                  before making a decision.
                </p>

              </div>

              <div className="space-y-6 p-6">

                {/* Comment */}

                <div>

                  <label
                    htmlFor="consultant-review-comment"
                    className="mb-2 block text-sm font-medium"
                  >
                    Review Comment
                  </label>

                  <Textarea
                    id="consultant-review-comment"
                    value={comment}
                    onChange={(event) =>
                      setComment(
                        event.target.value,
                      )
                    }
                    placeholder="Please revise the structural details before final approval."
                    className="min-h-40"
                  />

                  <p className="mt-2 text-xs text-muted-foreground">
                    Explain what should be approved,
                    revised, or rejected.
                  </p>

                </div>

                {/* Decision Buttons */}

                <div className="flex flex-wrap gap-3">

                  {/* APPROVE */}

                  <Button
                    type="button"
                    disabled={reviewing}
                    onClick={() =>
                      reviewProposal(
                        selectedProposal,
                        "Approved",
                      )
                    }
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />

                    Approve
                  </Button>

                  {/* REQUEST REVISION */}

                  <Button
                    type="button"
                    variant="outline"
                    disabled={reviewing}
                    onClick={() =>
                      reviewProposal(
                        selectedProposal,
                        "Revision Requested",
                      )
                    }
                  >
                    Request Revision
                  </Button>

                  {/* REJECT */}

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={reviewing}
                    onClick={() =>
                      reviewProposal(
                        selectedProposal,
                        "Rejected",
                      )
                    }
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />

                    Reject
                  </Button>

                </div>

                {/* Loading */}

                {reviewing && (
                  <p className="text-sm text-muted-foreground">
                    Submitting consultant review...
                  </p>
                )}

              </div>

            </div>

          </div>

        </PageContent>

      </PageContainer>
    );
  }

  /*
   * ==========================================================
   * PROPOSAL LIST SCREEN
   * ==========================================================
   */

  return (
    <PageContainer>

      <PageHeader
        title="Proposal Review"
        description="Review design proposals submitted by Architects."
      />

      <PageContent className="p-6 md:p-8">

        {/* ----------------------------------------------------
            PAGE INFORMATION
            ---------------------------------------------------- */}

        <div className="mb-6">

          <h2 className="text-lg font-semibold">
            Proposals Awaiting Review
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select a proposal to review its details
            and provide your decision.
          </p>

        </div>

        {/* ----------------------------------------------------
            LOADING
            ---------------------------------------------------- */}

        {loading ? (
          <div className="rounded-xl border p-12 text-center">

            <p className="text-sm text-muted-foreground">
              Loading proposals...
            </p>

          </div>
        ) : pendingProposals.length === 0 ? (
          /* --------------------------------------------------
             EMPTY
             -------------------------------------------------- */

          <div className="rounded-xl border border-dashed p-12 text-center">

            <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

            <h2 className="text-lg font-semibold">
              No proposals awaiting review
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Architect proposals assigned to the
              Consultant will appear here.
            </p>

          </div>
        ) : (
          /* --------------------------------------------------
             PROPOSAL TABLE
             -------------------------------------------------- */

          <div className="overflow-hidden rounded-xl border">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="border-b bg-muted/20">

                  <tr>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      ID
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Title
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Project
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Submitted By
                    </th>

                    <th className="px-4 py-4 text-right text-sm font-semibold">
                      Amount
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {pendingProposals.map(
                    (proposal) => (
                      <tr
                        key={proposal.id}
                        className="border-b last:border-b-0 hover:bg-muted/20"
                      >

                        {/* ID */}

                        <td className="px-4 py-4">

                          <span className="font-mono text-xs">
                            {
                              proposal.proposalId
                            }
                          </span>

                        </td>

                        {/* TITLE */}

                        <td className="px-4 py-4">

                          <button
                            type="button"
                            onClick={() => openProposal(proposal)}
                            className="cursor-pointer text-left font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            {
                              proposal.title
                            }
                          </button>

                        </td>

                        {/* PROJECT */}

                        <td className="px-4 py-4 text-sm">
                          {
                            proposal.projectCode
                          }
                        </td>

                        {/* SUBMITTED BY */}

                        <td className="px-4 py-4 text-sm">
                          {
                            proposal.submittedBy
                          }
                        </td>

                        {/* AMOUNT */}

                        <td className="px-4 py-4 text-right text-sm">
                          {
                            proposal.amount ??
                            "—"
                          }
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">

                          <StatusBadge
                            status={
                              proposal.status
                            }
                          />

                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-4">

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openProposal(proposal)}
                          >
                            Review →
                          </Button>

                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </PageContent>

    </PageContainer>
  );
}

/*
 * ============================================================
 * DISPLAY NAME
 * ============================================================
 */

ConsultantProposalsPage.displayName =
  "ConsultantProposalsPage";