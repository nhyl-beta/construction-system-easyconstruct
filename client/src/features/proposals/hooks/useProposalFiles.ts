import { useEffect, useState } from "react";
import { apiClient } from "@/services/api.client";

/** A file the Architect submitted with a proposal (server: GET /proposals/:id/files). */
export interface ProposalFile {
  id: number;
  name: string;
  label: string;
  url: string;
  size: string | null;
  uploadedBy: string;
  stage: string | null;
  filedAt: string | null;
}

export function useProposalFiles(proposalId: number | null) {
  const [files, setFiles] = useState<ProposalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proposalId == null) {
      setFiles([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get(`/proposals/${proposalId}/files`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((json: any) => {
        if (!cancelled) setFiles(Array.isArray(json?.data) ? json.data : []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the proposal's files.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  return { files, loading, error };
}
