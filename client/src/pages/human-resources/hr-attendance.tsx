import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";

export default function AttendancePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Attendance"
        description="Track employee attendance and time records"
      />
      <PageContent className="p-6 md:p-8 min-h-96">
        <ComingSoonCard
          title="Attendance Tracking"
          description="This page will contain the Attendance Management module. Track employee attendance, overtime, and work hours."
        />
      </PageContent>
    </PageContainer>
  );
}

AttendancePage.displayName = "AttendancePage";
