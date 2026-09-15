import { useEffect, useState } from "react";

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
};

export default function ConsultantProposalsPage() {
  const [proposals, setProposals] =
    useState<Proposal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedProposal, setSelectedProposal] =
    useState<Proposal | null>(null);

  const [comment, setComment] =
    useState("");

  const loadProposals = async () => {
    try {
      setLoading(true);

      const response =
        await fetch("/api/proposals");

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

  const reviewProposal = async (
    status:
      | "Approved"
      | "Revision Requested"
      | "Rejected",
  ) => {
    if (!selectedProposal) {
      return;
    }

    if (!comment.trim()) {
      alert(
        "Please enter a review comment.",
      );

      return;
    }

    try {
      const response = await fetch(
        `/api/proposals/${selectedProposal.id}/review`,
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
              comment,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Review failed.",
        );
      }

      setComment("");

      setSelectedProposal(null);

      await loadProposals();

      alert(
        `Proposal ${status.toLowerCase()}.`,
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to review proposal.",
      );
    }
  };

  const pendingProposals =
    proposals.filter(
      (proposal) =>
        proposal.assignedReviewer ===
          "Consultant" &&
        proposal.status === "Pending",
    );

    const reviewProposalFor = async (
  proposal: Proposal,
  status:
    | "Approved"
    | "Revision Requested"
    | "Rejected",
) => {
  if (!comment.trim()) {
    alert(
      "Please enter a review comment.",
    );

    return;
  }

  try {
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
            comment,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        "Review failed.",
      );
    }

    setComment("");

    setSelectedProposal(null);

    await loadProposals();

    alert(
      `Proposal ${status.toLowerCase()}.`,
    );
  } catch (error) {
    console.error(error);

    alert(
      "Failed to review proposal.",
    );
  }
};

  return (
    <PageContainer>
      <PageHeader
        title="Proposal Review"
        description="Review proposals submitted by Architects."
      />

      <PageContent className="p-6 md:p-8">
        {loading ? (
          <div className="text-sm text-muted-foreground">
            Loading proposals...
          </div>
        ) : pendingProposals.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="font-medium">
              No proposals awaiting review.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Architect proposals assigned to you
              will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProposals.map(
              (proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-xl border p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {proposal.proposalId}
                      </p>

                      <h2 className="mt-1 text-lg font-semibold">
                        {proposal.title}
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Project:{" "}
                        {proposal.projectCode}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Submitted by:{" "}
                        {proposal.submittedBy}
                      </p>
                    </div>

                    <StatusBadge
                      status={proposal.status}
                    />
                  </div>

                  {proposal.content && (
                    <div className="mt-4 rounded-lg bg-muted/40 p-4">
                      <p className="text-sm">
                        {proposal.content}
                      </p>
                    </div>
                  )}

                  <div className="mt-4">
                    <Textarea
                      value={
                        selectedProposal?.id ===
                        proposal.id
                          ? comment
                          : ""
                      }
                      onChange={(event) => {
                        setSelectedProposal(
                          proposal,
                        );

                        setComment(
                          event.target.value,
                        );
                      }}
                      placeholder="Enter your review comment..."
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
  onClick={() =>
    reviewProposalFor(
      proposal,
      "Approved",
    )
  }
>
  Approve
</Button>

<Button
  variant="outline"
  onClick={() =>
    reviewProposalFor(
      proposal,
      "Revision Requested",
    )
  }
>
  Request Revision
</Button>

<Button
  variant="destructive"
  onClick={() =>
    reviewProposalFor(
      proposal,
      "Rejected",
    )
  }
>
  Reject
</Button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}

ConsultantProposalsPage.displayName =
  "ConsultantProposalsPage";