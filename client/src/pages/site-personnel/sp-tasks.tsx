import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function TasksPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Manage field tasks and assignments"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Tasks Management"
          description="This page will contain the Tasks Management module. View and manage daily tasks, assignments, and work orders."
        />
      </PageContent>
    </PageContainer>
  );
}

TasksPage.displayName = "TasksPage";
