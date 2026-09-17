import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { AuthProvider } from "@/auth/auth-context";
import { ProtectedRoutes, PublicAuthRoute } from "@/components/auth/auth-routes";
import { RequireRole } from "@/components/auth/role-guard";

import { Layout } from "./components/refine-ui/layout/layout";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";

import { accessControlProvider } from "./providers/access-control-provider";
import { dataProvider } from "./providers/data";
import { resources } from "./providers/resources";

//Signin and Authentication Pages
import LoginPage from "@/pages/auth/login";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";


// ── Project Manager Pages ──
import DashboardRouter from "@/pages/dashboard/index";
import PMApprovals from "./pages/roles/project-manager/pm-approvals";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PMDocuments from "./pages/roles/project-manager/pm-documents";
import PMProjects from "./pages/roles/project-manager/pm-projects";
import PMWorkflows from "./pages/roles/project-manager/pm-workflows";

// ── Human Resources Pages ──
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import HRAttendance from "./pages/roles/human-resources/hr-attendance";
import HREmployees from "./pages/roles/human-resources/hr-employees";
import HRPayroll from "./pages/roles/human-resources/hr-payroll";
import HRWorkforce from "./pages/roles/human-resources/hr-workforce";

// ── Finance Pages ──
import FinanceBudget from "./pages/roles/finance/finance-budget";
import FinanceImpactReview from "./pages/roles/finance/finance-impact-review";
import FinancePayrollReview from "./pages/roles/finance/finance-payroll-review";

// ── Architect Pages ──
import ArchitectBlueprints from "./pages/roles/architect/architect-blueprints";
import ArchitectDesigns from "./pages/roles/architect/architect-designs";
import ArchitectDocumentation from "./pages/roles/architect/architect-documentation";
import ArchitectProjects from "./pages/roles/architect/architect-projects";
import ArchitectProposals from "./pages/roles/architect/architect-proposals";
import ArchitectReviews from "./pages/roles/architect/architect-reviews";
import ArchitectRevisions from "./pages/roles/architect/architect-revisions";

// ── Engineer Pages ──
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import EngineerIssues from "./pages/roles/engineer/engineer-issues";
import EngineerProgress from "./pages/roles/engineer/engineer-progress";
import EngineerRequirements from "./pages/roles/engineer/engineer-requirements";

// ── Site Personnel Pages ──
import SPTasks from "./pages/roles/site-personnel/sp-tasks";
import AttendanceRouter from "./pages/routers/attendance-router";
import DocumentsRouter from "./pages/routers/documents-router";
import IssuesRouter from "./pages/routers/issues-router";


// ── Consultant Pages ──
import ConsultantAdvisoryDocs from "./pages/roles/consultant/consultant-advisory-docs";
import ConsultantProposals from "./pages/roles/consultant/consultant-proposals";

// ── Admin Pages ──
import AdminProjects from "./pages/roles/admin/admin-projects";
import AdminWorkflows from "./pages/roles/admin/admin-workflows";
import AdminDocuments from "./pages/roles/admin/admin-documents";
import AdminActivityLogs from "./pages/roles/admin/admin-activity-logs";
import AdminSecurity from "./pages/roles/admin/admin-security";
import AdminNotifications from "./pages/roles/admin/admin-notifications";
import AdminRolesPermissions from "./pages/roles/admin/admin-roles-permissions";
import AdminWorkflowConfiguration from "./pages/roles/admin/admin-workflow-configuration";
import AdminApprovalHierarchy from "./pages/roles/admin/admin-approval-hierarchy";
import AdminSupport from "./pages/roles/admin/admin-support";

// ── Shared Pages ──
import EmployeeCreatePage from "@/features/employees/pages/EmployeeCreatePage";
import ProjectCreatePage from "@/features/projects/pages/ProjectCreatePage";
import ProjectDetailPage from "@/features/projects/pages/ProjectDetailPage";
import SharedAiInsights from "./pages/roles/shared/shared-ai-insights";
import SharedReports from "./pages/roles/shared/shared-reports";
import SharedResources from "./pages/roles/shared/shared-resources";

import "./App.css";
import ArchitectDesignCreate from "./pages/roles/architect/architect-design-create";
import ArchitectDesignDetail from "./pages/roles/architect/architect-design-detail";
import FinanceExpenses from "./pages/roles/finance/finance-expenses";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RefineKbarProvider>
          <ThemeProvider>
              <Refine
              resources={resources}
              dataProvider={dataProvider}
              accessControlProvider={accessControlProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "2gnXaG-MhFPwx-oPqcp0",
                title: {
                  text: "EasyConstruct",
                  icon: <img src="/client/public/favicon.ico" className="h-4 w-4"/>
                }
              }}
            >
                <Routes>
                  <Route element={<PublicAuthRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                  </Route>

                  <Route element={<ProtectedRoutes />}>
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
                  <Route
                    path="/projects/create"
                    element={<ProjectCreatePage />}
                  />
                  <Route path="/projects/new" element={<ProjectCreatePage />} />
                  <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

                  <Route path="/workflows" element={<PMWorkflows />} />
                  <Route path="/approvals" element={<PMApprovals />} />
                  <Route path="/documents" element={<DocumentsRouter />} />

                  {/* ── Human Resources Routes ── */}
                  <Route path="/employees" element={<HREmployees />} />
                  <Route
                    path="/employees/create"
                    element={<EmployeeCreatePage />}
                  />
                  <Route
                    path="/employees/edit/:id"
                    element={<EmployeeCreatePage />}
                  />
                  <Route
                    path="/employees/new"
                    element={<EmployeeCreatePage />}
                  />
                  <Route
                    path="/employees/:id/edit"
                    element={<EmployeeCreatePage />}
                  />
                  <Route path="/attendance" element={<AttendanceRouter />} />
                  <Route path="/payroll" element={<HRPayroll />} />
                  <Route path="/workforce-reports" element={<HRWorkforce />} />

                  {/* ── Finance Routes ── */}
                  <Route path="/budget" element={<FinanceBudget />} />
                  <Route path="/expenses" element={<FinanceExpenses />} />
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
                  <Route
                    path="/designs/new"
                    element={<ArchitectDesignCreate />}
                  />
                  <Route
                    path="/designs/:id"
                    element={<ArchitectDesignDetail />}
                  />
                  <Route path="/proposals" element={<ArchitectProposals />} />
                  <Route
                    path="/architect/projects"
                    element={<ArchitectProjects />}
                  />
                  <Route path="/revisions" element={<ArchitectRevisions />} />
                  <Route path="/reviews" element={<ArchitectReviews />} />
                  <Route
                    path="/architect/documents"
                    element={<ArchitectDocumentation />}
                  />
                  <Route path="/blueprints" element={<ArchitectBlueprints />} />

                  {/* ── Engineer Routes ── */}
                  <Route path="/progress" element={<EngineerProgress />} />
                  <Route
                    path="/requirements"
                    element={<EngineerRequirements />}
                  />
                  <Route path="/issues" element={<IssuesRouter />} />

                  {/* ── Site Personnel Routes ── */}
                  <Route path="/tasks" element={<SPTasks />} />

                  {/* ── Consultant Routes ── */}
                  <Route
                    path="/advisory-docs"
                    element={<ConsultantAdvisoryDocs />}
                  />

                  <Route
                    path="/consultant/proposals"
                    element={<ConsultantProposals />}
                  />

                  {/* ── Admin Routes ── */}
                  <Route
                    path="/admin/projects"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminProjects />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/workflows"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminWorkflows />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/documents"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminDocuments />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/activity-logs"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminActivityLogs />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/security"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminSecurity />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/notifications"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminNotifications />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/roles-permissions"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminRolesPermissions />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/workflow-configuration"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminWorkflowConfiguration />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/approval-hierarchy"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminApprovalHierarchy />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/support"
                    element={
                      <RequireRole allow={["admin", "super_admin"]}>
                        <AdminSupport />
                      </RequireRole>
                    }
                  />
                    </Route>
                  </Route>
                </Routes>
                 <Toaster />
                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler
                  handler={({ autoGeneratedTitle }) =>
                    autoGeneratedTitle.replace(/Refine$/, "EasyConstruct")
                  }
                />
              </Refine>
          </ThemeProvider>
        </RefineKbarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
