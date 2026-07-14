import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function ConsultantProposalsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Proposals"
        description="Review and manage advisory proposals"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Proposals Management"
          description="This page will contain the Proposals Management module. View and manage consulting proposals and recommendations."
        />
      </PageContent>
    </PageContainer>
  );
}

ConsultantProposalsPage.displayName = "ConsultantProposalsPage";
