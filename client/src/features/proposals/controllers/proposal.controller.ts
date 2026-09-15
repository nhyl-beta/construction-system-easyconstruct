import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Proposal,
  ProposalReviewer,
  ProposalStatus,
} from "../types/proposal.types";

export interface CreateProposalInput {
  proposalId: string;

  title: string;

  projectCode: string;

  submittedBy: string;

  amount?: string;

  content?: string;

  assignedReviewer?: ProposalReviewer;
}

export interface ReviewProposalInput {
  status:
    | "Approved"
    | "Revision Requested"
    | "Rejected";

  reviewerName?: string;

  reviewComment?: string;
}

export const useProposalsController = () => {
  const [proposals, setProposals] =
    useState<Proposal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [status, setStatus] =
    useState("all");

  const [error, setError] =
    useState<string | null>(null);

  const loadProposals =
    useCallback(async () => {
      const controller =
        new AbortController();

      setLoading(true);

      setError(null);

      try {
        const params =
          new URLSearchParams();

        if (query.trim()) {
          params.set(
            "search",
            query.trim(),
          );
        }

        if (status !== "all") {
          params.set(
            "status",
            status,
          );
        }

        const response =
          await fetch(
            `/api/proposals?${params.toString()}`,
            {
              signal:
                controller.signal,
            },
          );

        if (!response.ok) {
          throw new Error(
            `Failed to load proposals (${response.status})`,
          );
        }

        const json =
          await response.json();

        setProposals(
          json.data ?? [],
        );
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load proposals.",
        );
      } finally {
        setLoading(false);
      }

      return () =>
        controller.abort();
    }, [query, status]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  /*
   * CREATE
   */
  const createProposal =
    async (
      input: CreateProposalInput,
    ): Promise<Proposal | null> => {
      setSaving(true);

      setError(null);

      try {
        const response =
          await fetch(
            "/api/proposals",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                ...input,

                status: "Pending",
              }),
            },
          );

        if (!response.ok) {
          throw new Error(
            `Failed to create proposal (${response.status})`,
          );
        }

        const json =
          await response.json();

        const created =
          json.data as Proposal;

        await loadProposals();

        return created;
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to create proposal.",
        );

        return null;
      } finally {
        setSaving(false);
      }
    };

  /*
   * REVIEW
   */
  const reviewProposal =
    async (
      proposalId: number,
      input: ReviewProposalInput,
    ): Promise<Proposal | null> => {
      setSaving(true);

      setError(null);

      try {
        const response =
          await fetch(
            `/api/proposals/${proposalId}/review`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                input,
              ),
            },
          );

        if (!response.ok) {
          throw new Error(
            `Failed to review proposal (${response.status})`,
          );
        }

        const json =
          await response.json();

        const updated =
          json.data as Proposal;

        await loadProposals();

        return updated;
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to review proposal.",
        );

        return null;
      } finally {
        setSaving(false);
      }
    };

  const kpis = useMemo(() => {
    const total =
      proposals.length;

    const pending =
      proposals.filter(
        (p) =>
          p.status === "Pending" ||
          p.status === "In Review",
      ).length;

    const approved =
      proposals.filter(
        (p) =>
          p.status === "Approved",
      ).length;

    const revisionRequested =
      proposals.filter(
        (p) =>
          p.status ===
          "Revision Requested",
      ).length;

    return {
      total,
      pending,
      approved,
      revisionRequested,
    };
  }, [proposals]);

  return {
    proposals,

    loading,

    saving,

    error,

    query,
    setQuery,

    status,
    setStatus,

    kpis,

    refresh: loadProposals,

    createProposal,

    reviewProposal,
  };
};