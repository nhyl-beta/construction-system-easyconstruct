import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function ReportsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description="View and generate project reports"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Reports & Analytics"
          description="This page will contain reporting and analytics features for project performance, budgets, timelines, and key metrics."
        />
      </PageContent>
    </PageContainer>
  );
}

ReportsPage.displayName = "ReportsPage";
