import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function PayrollPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Payroll"
        description="Manage payroll and salary information"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Payroll Management"
          description="This page will contain the Payroll Management module. Process payroll, manage salaries, and handle compensation."
        />
      </PageContent>
    </PageContainer>
  );
}

PayrollPage.displayName = "PayrollPage";
