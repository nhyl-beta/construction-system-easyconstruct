import { useRoleConfig } from "@/hooks/use-role-config";
import HRDashboardPage from "@/pages/roles/human-resources/hr-dashboard";
import PMDashboardPage from "@/pages/roles/project-manager/pm-dashboard";
import ArchitectDashboard from "../roles/architect/architect-dashboard";
import FinanceDashboardPage from "../roles/finance/finance-dashboard";

// ── Role → Dashboard map ──────────────────────────────────────────────────────

const ROLE_DASHBOARD: Record<string, React.ComponentType> = {
  project_manager: PMDashboardPage,
  human_resources: HRDashboardPage,
  finance_manager: FinanceDashboardPage,
  architect: ArchitectDashboard,
  // engineer:        EngineerDashboardPage,
  // site_personnel:  SitePersonnelDashboardPage,
  // consultant:      ConsultantDashboardPage,
  // owner:           OwnerDashboardPage,
  // it_designer:     ITDesignerDashboardPage,
};

// Fallback for roles without a dashboard yet
function FallbackDashboard() {
  const { identity } = useRoleConfig();
  const role = identity.role;
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
  const { identity } = useRoleConfig();
  const role = identity.role;
  const Dashboard = ROLE_DASHBOARD[role] ?? FallbackDashboard;
  return <Dashboard />;
}
