import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function ProgressPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Progress"
        description="Track construction progress and milestones"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Progress Tracking"
          description="This page will contain the Progress Tracking module. Monitor construction progress, timelines, and milestone completion."
        />
      </PageContent>
    </PageContainer>
  );
}

ProgressPage.displayName = "ProgressPage";
