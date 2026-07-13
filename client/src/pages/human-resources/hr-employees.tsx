import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function EmployeesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Employees"
        description="Manage employee records and information"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Employee Management"
          description="This page will contain the Employee Management module. View, add, and manage employee records, profiles, and information."
        />
      </PageContent>
    </PageContainer>
  );
}

EmployeesPage.displayName = "EmployeesPage";
