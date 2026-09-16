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
  reviewerName?: string | null;
  reviewComment?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
};

type ReviewStatus =
  | "Approved"
  | "Revision Requested"
  | "Rejected";

export default function ConsultantProposalsPage() {
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

  const loadProposals = async () => {
    try {
      setLoading(true);

      const response =
        await fetch("/api/proposals");

      if (!response.ok) {
        throw new Error(
          "Failed to load proposals.",
        );
      }

      const result =
        await response.json();

      setProposals(
        result.data ?? [],
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

  useEffect(() => {
    loadProposals();
  }, []);

  /*
   * For the thesis demonstration, we show:
   *
   * 1. Pending proposals assigned to Consultant
   *
   * OR
   *
   * 2. Pending proposals submitted by Architect
   *    that do not have an assigned reviewer yet.
   *
   * This allows your existing TEST PROPOSA to appear
   * even if it was created before assignedReviewer
   * was added to the database.
   */
  const pendingProposals =
    proposals.filter((proposal) => {
      if (proposal.status !== "Pending") {
        return false;
      }

      const assignedReviewer =
        proposal.assignedReviewer?.trim().toLowerCase();

      if (assignedReviewer === "consultant") {
        return true;
      }

      if (
        !assignedReviewer &&
        proposal.submittedBy ===
          "Architect"
      ) {
        return true;
      }

      return false;
    });

  const reviewProposal = async (
    proposal: Proposal,
    status: ReviewStatus,
  ) => {
    if (!comment.trim()) {
      alert(
        "Please enter a review comment before submitting your decision.",
      );

      return;
    }

    try {
      setReviewing(true);

      const response = await fetch(
        `/api/proposals/${proposal.id}/review`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,

            reviewerName:
              "Consultant",

            reviewComment:
              comment.trim(),
          }),
        },
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Review API error:",
          errorText,
        );

        throw new Error(
          "Failed to submit review.",
        );
      }

      setComment("");

      setSelectedProposal(null);

      await loadProposals();

      alert(
        `Proposal ${status.toLowerCase()} successfully.`,
      );
    } catch (error) {
      console.error(
        "Failed to review proposal:",
        error,
      );

      alert(
        "Failed to submit the proposal review.",
      );
    } finally {
      setReviewing(false);
    }
  };

  /*
   * ------------------------------------------------
   * PROPOSAL LIST
   * ------------------------------------------------
   */

  if (!selectedProposal) {
    return (
      <PageContainer>
        <PageHeader
          title="Proposal Review"
          description="Review design proposals submitted by Architects."
        />

        <PageContent className="p-6 md:p-8">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading proposals...
            </div>
          ) : pendingProposals.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

              <h2 className="text-lg font-semibold">
                No proposals awaiting review
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Architect proposals assigned to the
                Consultant will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Proposals Awaiting Review
                </h2>

                <p className="text-sm text-muted-foreground">
                  Click a proposal to open its details
                  and provide your review.
                </p>
              </div>

              <div className="grid gap-4">
                {pendingProposals.map(
                  (proposal) => (
                    <button
                      key={proposal.id}
                      type="button"
                      onClick={() =>
                        setSelectedProposal(
                          proposal,
                        )
                      }
                      className="w-full rounded-xl border bg-card p-5 text-left transition hover:border-primary/50 hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {
                                proposal.proposalId
                              }
                            </span>

                            <StatusBadge
                              status={
                                proposal.status
                              }
                            />
                          </div>

                          <h3 className="mt-2 text-lg font-semibold">
                            {proposal.title}
                          </h3>

                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p>
                              Project:{" "}
                              <span className="font-medium text-foreground">
                                {
                                  proposal.projectCode
                                }
                              </span>
                            </p>

                            <p>
                              Submitted by:{" "}
                              <span className="font-medium text-foreground">
                                {
                                  proposal.submittedBy
                                }
                              </span>
                            </p>

                            {proposal.amount && (
                              <p>
                                Amount:{" "}
                                <span className="font-medium text-foreground">
                                  {
                                    proposal.amount
                                  }
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="shrink-0 text-sm font-medium text-primary">
                          Review →
                        </span>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </PageContent>
      </PageContainer>
    );
  }

  /*
   * ------------------------------------------------
   * PROPOSAL DETAILS / REVIEW
   * ------------------------------------------------
   */

  return (
    <PageContainer>
      <PageHeader
        title="Proposal Review"
        description="Review the proposal and submit your professional assessment."
      />

      <PageContent className="p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Back button */}

          <Button
            variant="ghost"
            onClick={() => {
              setSelectedProposal(null);
              setComment("");
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Proposals
          </Button>

          {/* Proposal information */}

          <div className="rounded-xl border bg-card">
            <div className="border-b p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {selectedProposal.proposalId}
                  </p>

                  <h1 className="mt-2 text-2xl font-bold">
                    {selectedProposal.title}
                  </h1>
                </div>

                <StatusBadge
                  status={
                    selectedProposal.status
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
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

              {selectedProposal.amount && (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Amount
                  </p>

                  <p className="mt-1 font-medium">
                    {
                      selectedProposal.amount
                    }
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Assigned Reviewer
                </p>

                <p className="mt-1 font-medium">
                  {selectedProposal.assignedReviewer ??
                    "Consultant"}
                </p>
              </div>
            </div>
          </div>

          {/* Proposal content */}

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

          {/* Consultant review */}

          <div className="rounded-xl border bg-card">
            <div className="border-b p-6">
              <h2 className="font-semibold">
                Consultant Review
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Provide your assessment before
                making a decision.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="review-comment"
                  className="mb-2 block text-sm font-medium"
                >
                  Review Comment
                </label>

                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) =>
                    setComment(
                      event.target.value,
                    )
                  }
                  placeholder="Please revise the structural details before final approval."
                  className="min-h-[140px]"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Explain your reasoning or provide
                  instructions to the Architect.
                </p>
              </div>

              {/* Decision buttons */}

              <div className="flex flex-wrap gap-3">
                <Button
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

                <Button
                  variant="outline"
                  disabled={reviewing}
                  onClick={() =>
                    reviewProposal(
                      selectedProposal,
                      "Revision Requested",
                    )
                  }
                  className="gap-2"
                >
                  Request Revision
                </Button>

                <Button
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

              {reviewing && (
                <p className="text-sm text-muted-foreground">
                  Submitting review...
                </p>
              )}
            </div>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}

ConsultantProposalsPage.displayName =
  "ConsultantProposalsPage";