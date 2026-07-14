import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function AdvisoryDocsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Advisory Documents"
        description="Manage advisory and reference documents"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Advisory Documents"
          description="This page will contain the Advisory Documents module. Upload and manage advisory documentation and resources."
        />
      </PageContent>
    </PageContainer>
  );
}

AdvisoryDocsPage.displayName = "AdvisoryDocsPage";
