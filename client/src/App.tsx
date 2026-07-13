import { Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { BrowserRouter, Outlet, Route, Routes } from "react-router";

import "./App.css";

import { Layout } from "./components/refine-ui/layout/layout";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";

import { resources } from "./providers/resources";
import { accessControlProvider } from "./providers/access-control-provider";

// ── Project Manager Pages ──
import PMDashboard from "./pages/project-manager/pm-dashboard";
import PMProjects from "./pages/project-manager/pm-projects";
import PMWorkflows from "./pages/project-manager/pm-workflows";
import PMApprovals from "./pages/project-manager/pm-approvals";
import PMDocuments from "./pages/project-manager/pm-documents";
import PMAiInsights from "./pages/project-manager/pm-ai-insights";
import PMReports from "./pages/project-manager/pm-reports";
import PMResources from "./pages/project-manager/pm-resources";

// ── Human Resources Pages ──
import HRDashboard from "./pages/human-resources/hr-dashboard";
import HREmployees from "./pages/human-resources/hr-employees";
import HRAttendance from "./pages/human-resources/hr-attendance";
import HRPayroll from "./pages/human-resources/hr-payroll";

// ── Finance Pages ──
import FinanceBudget from "./pages/finance/finance-budget";
import FinancePayrollReview from "./pages/finance/finance-payroll-review";
import FinanceImpactReview from "./pages/finance/finance-impact-review";

// ── Architect Pages ──
import ArchitectDesigns from "./pages/architect/architect-designs";
import ArchitectProposals from "./pages/architect/architect-proposals";

// ── Engineer Pages ──
import EngineerProgress from "./pages/engineer/engineer-progress";
import EngineerRequirements from "./pages/engineer/engineer-requirements";
import EngineerIssues from "./pages/engineer/engineer-issues";

// ── Site Personnel Pages ──
import SPTasks from "./pages/site-personnel/sp-tasks";

// ── Consultant Pages ──
import ConsultantProposals from "./pages/consultant/consultant-proposals";
import ConsultantAdvisoryDocs from "./pages/consultant/consultant-advisory-docs";

// ── Shared Pages ──
import SharedAiInsights from "./pages/shared/shared-ai-insights";
import SharedReports from "./pages/shared/shared-reports";
import SharedResources from "./pages/shared/shared-resources";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              resources={resources}
              accessControlProvider={accessControlProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "2gnXaG-MhFPwx-oPqcp0",
              }}
            >
              <Routes>
                <Route
                  element={
                    <Layout>
                      <Outlet />
                    </Layout>
                  }
                >
                  {/* ── Shared Routes ── */}
                  <Route path="/" element={<PMDashboard />} />
                  <Route path="/dashboard" element={<PMDashboard />} />
                  <Route path="/ai-insights" element={<SharedAiInsights />} />
                  <Route path="/reports" element={<SharedReports />} />
                  <Route path="/resources" element={<SharedResources />} />

                  {/* ── Project Manager Routes ── */}
                  <Route path="/projects" element={<PMProjects />} />
                  <Route path="/workflows" element={<PMWorkflows />} />
                  <Route path="/approvals" element={<PMApprovals />} />
                  <Route path="/documents" element={<PMDocuments />} />

                  {/* ── Human Resources Routes ── */}
                  <Route path="/employees" element={<HREmployees />} />
                  <Route path="/attendance" element={<HRAttendance />} />
                  <Route path="/payroll" element={<HRPayroll />} />

                  {/* ── Finance Routes ── */}
                  <Route path="/budget" element={<FinanceBudget />} />
                  <Route path="/payroll-review" element={<FinancePayrollReview />} />
                  <Route path="/impact-review" element={<FinanceImpactReview />} />

                  {/* ── Architect Routes ── */}
                  <Route path="/designs" element={<ArchitectDesigns />} />
                  <Route path="/proposals" element={<ArchitectProposals />} />

                  {/* ── Engineer Routes ── */}
                  <Route path="/progress" element={<EngineerProgress />} />
                  <Route path="/requirements" element={<EngineerRequirements />} />
                  <Route path="/issues" element={<EngineerIssues />} />

                  {/* ── Site Personnel Routes ── */}
                  <Route path="/tasks" element={<SPTasks />} />

                  {/* ── Consultant Routes ── */}
                  <Route path="/advisory-docs" element={<ConsultantAdvisoryDocs />} />
                </Route>
              </Routes>
              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
