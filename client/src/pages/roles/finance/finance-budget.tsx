import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function BudgetPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Budget"
        description="Manage project budgets and financial planning"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Budget Management"
          description="This page will contain the Budget Management module. Create, track, and manage project budgets and expenses."
        />
      </PageContent>
    </PageContainer>
  );
}

BudgetPage.displayName = "BudgetPage";
