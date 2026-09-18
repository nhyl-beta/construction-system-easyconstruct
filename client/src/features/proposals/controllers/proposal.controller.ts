import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiClient } from "@/services/api.client";

import type {
  Proposal,
  ProposalReviewer,
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

export interface UpdateProposalInput {
  title?: string;

  projectCode?: string;

  amount?: string;

  content?: string;

  status?: string;
}

// Unwraps the backend's { success, message, data } envelope.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap<T>(json: any): T {
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
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

        const qs = params.toString();
        const json = await apiClient.get(
          `/proposals${qs ? `?${qs}` : ""}`,
        );

        setProposals(
          unwrap<Proposal[]>(json) ?? [],
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load proposals.",
        );
      } finally {
        setLoading(false);
      }
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
        const json = await apiClient.post("/proposals", {
          ...input,
          status: "Pending",
        });

        const created = unwrap<Proposal>(json);

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
   * UPDATE
   */
  const updateProposal =
    async (
      id: number,
      input: UpdateProposalInput,
    ): Promise<Proposal | null> => {
      setSaving(true);

      setError(null);

      try {
        const json = await apiClient.patch(`/proposals/${id}`, input);

        const updated = unwrap<Proposal>(json);

        await loadProposals();

        return updated;
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update proposal.",
        );

        return null;
      } finally {
        setSaving(false);
      }
    };

  /*
   * ARCHIVE
   */
  const archiveProposal =
    async (id: number): Promise<Proposal | null> => updateProposal(id, { status: "Archived" });

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
        const json = await apiClient.patch(`/proposals/${proposalId}/review`, input);

        const updated = unwrap<Proposal>(json);

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

    updateProposal,

    archiveProposal,

    reviewProposal,
  };
};
