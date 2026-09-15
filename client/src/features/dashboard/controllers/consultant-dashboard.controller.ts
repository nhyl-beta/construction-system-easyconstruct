import { useMemo } from "react";

import { useProposals } from "@/features/proposals/hooks/useProposals";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useFieldDocuments } from "@/features/documents/hooks/use-field-documents";

export const useConsultantDashboardController = () => {
  const proposals = useProposals();
  const projects = useProjects();
  const documents = useFieldDocuments();

  const loading =
    proposals.loading ||
    projects.loading ||
    documents.loading;

  const proposalsAwaitingReview = useMemo(
    () =>
      proposals.proposals.filter(
        (p) => p.status === "Pending",
      ),
    [proposals.proposals],
  );

  const recentlyReviewed = useMemo(
    () =>
      proposals.proposals
        .filter((p) => p.status !== "Pending")
        .sort((a, b) =>
          (b.updatedAt ?? "").localeCompare(
            a.updatedAt ?? "",
          ),
        )
        .slice(0, 5),
    [proposals.proposals],
  );

  return {
    loading,

    kpis: {
      pendingReviews: proposals.kpis.pending,
      totalProposals: proposals.kpis.total,
      activeProjects: projects.kpis.total,
      advisoryDocuments: documents.documents.length,
    },

    proposalsAwaitingReview,
    recentlyReviewed,

    approvals: {
      available: false,
    },
  } as const;
};

export default useConsultantDashboardController;
