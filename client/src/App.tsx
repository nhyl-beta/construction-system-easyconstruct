import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
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
import ConsultantDesigns from "./pages/roles/consultant/consultant-designs";
import ConsultantDesignReviews from "./pages/roles/consultant/consultant-design-reviews";
import ConsultantProjects from "./pages/roles/consultant/consultant-projects";

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

// ── Owner Pages ──
import OwnerPortfolio from "./pages/roles/owner/owner-portfolio";
import OwnerProposals from "./pages/roles/owner/owner-proposals";
import OwnerAccountRecovery from "./pages/roles/owner/owner-account-recovery";

// ── IT Designer Pages ──
import ITDesignerUsers from "./pages/roles/it-designer/it-designer-users";
import ITDesignerProposals from "./pages/roles/it-designer/it-designer-proposals";

// ── Shared Pages ──
import EmployeeCreatePage from "@/features/employees/pages/EmployeeCreatePage";
import ProjectCreatePage from "@/features/projects/pages/ProjectCreatePage";
import ProjectDetailPage from "@/features/projects/pages/ProjectDetailPage";
import SharedReports from "./pages/roles/shared/shared-reports";
import SharedResources from "./pages/roles/shared/shared-resources";

import "./App.css";
import ArchitectDesignCreate from "./pages/roles/architect/architect-design-create";
import ArchitectDesignDetail from "./pages/roles/architect/architect-design-detail";
import FinanceExpenses from "./pages/roles/finance/finance-expenses";
import NotFoundPage from "./pages/not-found";

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
                  </Route>

                  {/* Deliberately outside PublicAuthRoute: Owner's fail-safe
                      recovery (owner-account-recovery.tsx) sends this link to
                      an Owner who is already signed in, to reset a DIFFERENT
                      account's (IT Designer's) password. PublicAuthRoute would
                      otherwise bounce a logged-in visitor straight back to
                      their dashboard before they could use the link. */}
                      
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                  {/* AI Insights is a placeholder surface, permanently hidden
                      behind FEATURES.aiPlaceholders (hardcoded false) — see
                      config/features.ts. A stale link/bookmark lands on the
                      dashboard instead of a dead AI surface. */}
                  <Route path="/ai-insights" element={<Navigate to="/dashboard" replace />} />
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
                    element={
                      <RequireRole allow={["consultant"]}>
                        <ConsultantProposals />
                      </RequireRole>
                    }
                  />

                  {/* Read-only advisory views. Consultant previously landed on
                      the shared PM projects page, which offers create/edit and
                      full commercial data. */}
                  <Route
                    path="/consultant/designs"
                    element={
                      <RequireRole allow={["consultant"]}>
                        <ConsultantDesigns />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/consultant/projects"
                    element={
                      <RequireRole allow={["consultant"]}>
                        <ConsultantProjects />
                      </RequireRole>
                    }
                  />
                  {/* E2: was "/reviews" under Architect (architect-reviews.tsx)
                      — the architect deciding their own design's review made
                      no sense, and the server now refuses it anyway
                      (design-reviews/routes.ts requireRole consultant/pm/admin). */}
                  <Route
                    path="/consultant/design-reviews"
                    element={
                      <RequireRole allow={["consultant"]}>
                        <ConsultantDesignReviews />
                      </RequireRole>
                    }
                  />

                  {/* ── Admin Routes ── */}
                  <Route
                    path="/admin/projects"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminProjects />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/workflows"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminWorkflows />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/documents"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminDocuments />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/activity-logs"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminActivityLogs />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/security"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminSecurity />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/notifications"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminNotifications />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/roles-permissions"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminRolesPermissions />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/workflow-configuration"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminWorkflowConfiguration />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/approval-hierarchy"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminApprovalHierarchy />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin/support"
                    element={
                      <RequireRole allow={["admin", "it_designer"]}>
                        <AdminSupport />
                      </RequireRole>
                    }
                  />

                  {/* ── Owner Routes ── */}
                  {/* Owner's oversight screens are the Admin components
                      themselves, not copies: both are read-only views over
                      /api/audit-logs, which Owner is authorized for. Mounting
                      them on /owner/* keeps the existing /admin/* guards
                      untouched. */}
                  <Route
                    path="/owner/portfolio"
                    element={
                      <RequireRole allow={["owner"]}>
                        <OwnerPortfolio />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/owner/proposals"
                    element={
                      <RequireRole allow={["owner"]}>
                        <OwnerProposals />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/owner/audit-trail"
                    element={
                      <RequireRole allow={["owner"]}>
                        <AdminActivityLogs />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/owner/oversight"
                    element={
                      <RequireRole allow={["owner"]}>
                        <AdminSecurity />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/owner/account-recovery"
                    element={
                      <RequireRole allow={["owner"]}>
                        <OwnerAccountRecovery />
                      </RequireRole>
                    }
                  />

                  {/* ── IT Designer Routes ── */}
                  <Route
                    path="/it-designer/users"
                    element={
                      <RequireRole allow={["it_designer"]}>
                        <ITDesignerUsers />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/it-designer/proposals"
                    element={
                      <RequireRole allow={["it_designer"]}>
                        <ITDesignerProposals />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/it-designer/roles-permissions"
                    element={
                      <RequireRole allow={["it_designer"]}>
                        <AdminRolesPermissions />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/it-designer/activity-logs"
                    element={
                      <RequireRole allow={["it_designer"]}>
                        <AdminActivityLogs />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/it-designer/security"
                    element={
                      <RequireRole allow={["it_designer"]}>
                        <AdminSecurity />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/it-designer/support"
                    element={
                      <RequireRole allow={["it_designer"]}>
                        <AdminSupport />
                      </RequireRole>
                    }
                  />

                  {/* ── Catch-all ── */}
                  <Route path="*" element={<NotFoundPage />} />
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
