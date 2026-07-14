import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function SharedAiInsightsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="AI Insights"
        description="AI-powered insights and recommendations"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="AI Insights"
          description="This page will contain AI-powered insights across the organization with predictive analytics and intelligent recommendations."
        />
      </PageContent>
    </PageContainer>
  );
}

SharedAiInsightsPage.displayName = "SharedAiInsightsPage";
