// src/pages/dashboard/index.tsx
import { MOCK_IDENTITY } from "@/config/mock-role";
import HRDashboardPage from "@/pages/roles/human-resources/hr-dashboard";
import PMDashboardPage from "@/pages/roles/project-manager/pm-dashboard";

// ── Role → Dashboard map ──────────────────────────────────────────────────────
// Add a new entry here whenever a new role dashboard is created.
// No other file needs to change.

const ROLE_DASHBOARD: Record<string, React.ComponentType> = {
  project_manager: PMDashboardPage,
  human_resources: HRDashboardPage,
  // finance_manager: FinanceDashboardPage,
  // architect:       ArchitectDashboardPage,
  // engineer:        EngineerDashboardPage,
  // site_personnel:  SitePersonnelDashboardPage,
  // consultant:      ConsultantDashboardPage,
  // owner:           OwnerDashboardPage,
  // it_designer:     ITDesignerDashboardPage,
};

// Fallback for roles without a dashboard yet
function FallbackDashboard() {
  const role = MOCK_IDENTITY.role;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium text-foreground">
        Dashboard for <span className="text-primary">{role}</span> is coming
        soon.
      </p>
      <p className="text-xs text-muted-foreground">
        This workspace is under construction.
      </p>
    </div>
  );
}

export default function DashboardRouter() {
  const role = MOCK_IDENTITY.role;
  const Dashboard = ROLE_DASHBOARD[role] ?? FallbackDashboard;
  return <Dashboard />;
}
