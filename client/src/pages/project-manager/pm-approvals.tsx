import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function ApprovalsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Approvals"
        description="Review and manage project approvals"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Approvals Management"
          description="This page will contain the Approvals module. Review pending approvals, manage approval workflows, and track approval history."
        />
      </PageContent>
    </PageContainer>
  );
}

ApprovalsPage.displayName = "ApprovalsPage";
