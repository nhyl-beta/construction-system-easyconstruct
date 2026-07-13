import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function DocumentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        description="Manage project documents and files"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Documents Management"
          description="This page will contain the Documents module. Upload, organize, and manage project-related documents and files."
        />
      </PageContent>
    </PageContainer>
  );
}

DocumentsPage.displayName = "DocumentsPage";
