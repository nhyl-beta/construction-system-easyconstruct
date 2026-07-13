import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function SharedResourcesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Resources"
        description="Access shared resources and tools"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Resources & Tools"
          description="This page will contain shared resources, tools, templates, and reference materials for the organization."
        />
      </PageContent>
    </PageContainer>
  );
}

SharedResourcesPage.displayName = "SharedResourcesPage";
