import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function DesignsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Designs"
        description="Manage architectural designs and blueprints"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Design Management"
          description="This page will contain the Design Management module. Upload, organize, and manage architectural designs and blueprints."
        />
      </PageContent>
    </PageContainer>
  );
}

DesignsPage.displayName = "DesignsPage";
