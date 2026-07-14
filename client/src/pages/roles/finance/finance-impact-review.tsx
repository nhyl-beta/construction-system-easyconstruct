import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function ImpactReviewPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Impact Review"
        description="Review financial impact and performance"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Impact Review"
          description="This page will contain the Impact Review module. Analyze financial impact, performance metrics, and business outcomes."
        />
      </PageContent>
    </PageContainer>
  );
}

ImpactReviewPage.displayName = "ImpactReviewPage";
