import { useDesigns } from "@/features/designs/hooks/useDesigns";
import { useProposals } from "@/features/proposals/hooks/useProposals";

export const useArchitectDashboardController = () => {
  const designs = useDesigns();
  const proposals = useProposals();

  const recentDesigns = [...designs.designs]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);

  return {
    loading: designs.loading || proposals.loading,
    kpis: designs.kpis,
    proposalKpis: proposals.kpis,
    recentDesigns,
  };
};