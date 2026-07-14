import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function RequirementsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Requirements"
        description="Manage project requirements and specifications"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Requirements Management"
          description="This page will contain the Requirements Management module. Define, track, and manage project requirements and specifications."
        />
      </PageContent>
    </PageContainer>
  );
}

RequirementsPage.displayName = "RequirementsPage";
