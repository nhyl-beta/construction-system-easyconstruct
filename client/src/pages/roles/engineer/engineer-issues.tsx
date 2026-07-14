import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function IssuesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Issues"
        description="Track and manage project issues"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Issues Tracking"
          description="This page will contain the Issues Tracking module. Report, track, and resolve construction and technical issues."
        />
      </PageContent>
    </PageContainer>
  );
}

IssuesPage.displayName = "IssuesPage";
