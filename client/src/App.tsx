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

import { accessControlProvider } from "./providers/access-control-provider";
import { resources } from "./providers/resources";

// ── Project Manager Pages ──
import DashboardRouter from "@/pages/dashboard/index";
import PMApprovals from "./pages/roles/project-manager/pm-approvals";
import PMDocuments from "./pages/roles/project-manager/pm-documents";
import PMProjects from "./pages/roles/project-manager/pm-projects";
import PMWorkflows from "./pages/roles/project-manager/pm-workflows";

// ── Human Resources Pages ──
import HRAttendance from "./pages/roles/human-resources/hr-attendance";
import HREmployees from "./pages/roles/human-resources/hr-employees";
import HRPayroll from "./pages/roles/human-resources/hr-payroll";

// ── Finance Pages ──
import FinanceBudget from "./pages/roles/finance/finance-budget";
import FinanceImpactReview from "./pages/roles/finance/finance-impact-review";
import FinancePayrollReview from "./pages/roles/finance/finance-payroll-review";

// ── Architect Pages ──
import ArchitectDesigns from "./pages/roles/architect/architect-designs";
import ArchitectProposals from "./pages/roles/architect/architect-proposals";

// ── Engineer Pages ──
import EngineerIssues from "./pages/roles/engineer/engineer-issues";
import EngineerProgress from "./pages/roles/engineer/engineer-progress";
import EngineerRequirements from "./pages/roles/engineer/engineer-requirements";

// ── Site Personnel Pages ──
import SPTasks from "./pages/roles/site-personnel/sp-tasks";

// ── Consultant Pages ──
import ConsultantAdvisoryDocs from "./pages/roles/consultant/consultant-advisory-docs";

// ── Shared Pages ──
import SharedAiInsights from "./pages/roles/shared/shared-ai-insights";
import SharedReports from "./pages/roles/shared/shared-reports";
import SharedResources from "./pages/roles/shared/shared-resources";

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
                  <Route path="/" element={<DashboardRouter />} />
                  <Route path="/dashboard" element={<DashboardRouter />} />
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
                  <Route
                    path="/payroll-review"
                    element={<FinancePayrollReview />}
                  />
                  <Route
                    path="/impact-review"
                    element={<FinanceImpactReview />}
                  />

                  {/* ── Architect Routes ── */}
                  <Route path="/designs" element={<ArchitectDesigns />} />
                  <Route path="/proposals" element={<ArchitectProposals />} />

                  {/* ── Engineer Routes ── */}
                  <Route path="/progress" element={<EngineerProgress />} />
                  <Route
                    path="/requirements"
                    element={<EngineerRequirements />}
                  />
                  <Route path="/issues" element={<EngineerIssues />} />

                  {/* ── Site Personnel Routes ── */}
                  <Route path="/tasks" element={<SPTasks />} />

                  {/* ── Consultant Routes ── */}
                  <Route
                    path="/advisory-docs"
                    element={<ConsultantAdvisoryDocs />}
                  />
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
