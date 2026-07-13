import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function WorkflowsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Workflows"
        description="Define and manage project workflows"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Workflows Management"
          description="This page will contain the Workflows module. Create and manage project workflows, processes, and automation rules."
        />
      </PageContent>
    </PageContainer>
  );
}

WorkflowsPage.displayName = "WorkflowsPage";
