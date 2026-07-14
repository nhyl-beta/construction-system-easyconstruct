import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function PayrollReviewPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Payroll Review"
        description="Review and manage payroll operations"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Payroll Review"
          description="This page will contain the Payroll Review module. Review payroll entries, approve payments, and manage compensation."
        />
      </PageContent>
    </PageContainer>
  );
}

PayrollReviewPage.displayName = "PayrollReviewPage";
