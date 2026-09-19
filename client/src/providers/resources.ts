import type { ResourceProps } from "@refinedev/core";

export const resources: ResourceProps[] = [
  // Shared
  {
    name: "dashboard",
    list: "/dashboard",
    meta: { label: "Dashboard", group: "Workspace" },
  },

  // Project Manager
  {
    name: "projects",
    list: "/projects",
    create: "/projects/create",
    edit: "/projects/edit/:id",
    show: "/projects/show/:id",
    meta: { label: "Projects", group: "Workspace" },
  },
  {
    name: "workflows",
    list: "/workflows",
    meta: { label: "Workflows", group: "Workspace" },
  },
  {
    name: "approvals",
    list: "/approvals",
    meta: { label: "Approvals", group: "Workspace" },
  },
  {
    name: "documents",
    list: "/documents",
    meta: { label: "Documents", group: "Workspace" },
  },

  // HR
  {
    name: "employees",
    list: "/employees",
    create: "/employees/create",
    edit: "/employees/edit/:id",
    meta: { label: "Employees", group: "Workspace" },
  },
  {
    name: "attendance",
    list: "/attendance",
    meta: { label: "Attendance", group: "Workspace" },
  },
  {
    name: "payroll",
    list: "/payroll",
    meta: { label: "Payroll", group: "Workspace" },
  },
  {
    name: "workforce-reports",
    list: "/workforce-reports",
    meta: { label: "Workforce Reports", group: "Intelligence" },
  },

  // Finance
  {
    name: "budget",
    list: "/budget",
    meta: { label: "Budget", group: "Workspace" },
  },
  {
    name: "payroll-review",
    list: "/payroll-review",
    meta: { label: "Payroll Review", group: "Workspace" },
  },
  {
    name: "expenses",
    list: "/expenses",
    meta: { label: "Expenses", group: "Workspace" },
  },
  {
    name: "impact-review",
    list: "/impact-review",
    meta: { label: "Impact Review", group: "Workspace" },
  },
  // FIX: removed duplicate "payroll-review" and "impact-review" entries
  // that were registered twice (identical objects, likely copy-paste).
  // Refine resource names must be unique — a duplicate can cause the
  // second registration to silently shadow or conflict with the first.

  // Architect
  {
    name: "designs",
    list: "/designs",
    meta: { label: "Designs", group: "Workspace" },
  },
  {
    name: "proposals",
    list: "/proposals",
    meta: { label: "Proposals", group: "Workspace" },
  },

  // Architect
  {
    name: "designs",
    list: "/designs",
    create: "/designs/new",
    show: "/designs/:id",
    meta: { label: "Designs", group: "Workspace" },
  },
  {
    name: "proposals",
    list: "/proposals",
    meta: { label: "Proposals", group: "Workspace" },
  },
  {
    name: "architect-projects",
    list: "/architect/projects",
    meta: { label: "Projects", group: "Workspace" },
  },
  {
    name: "revisions",
    list: "/revisions",
    meta: { label: "Revisions", group: "Workspace" },
  },
  {
    name: "reviews",
    list: "/reviews",
    meta: { label: "Reviews", group: "Workspace" },
  },
  {
    name: "architect-documents",
    list: "/architect/documents",
    meta: { label: "Documentation", group: "Workspace" },
  },
  {
    name: "blueprints",
    list: "/blueprints",
    meta: { label: "Blueprints", group: "Workspace" },
  },

  // Engineer
  {
    name: "progress",
    list: "/progress",
    meta: { label: "Progress", group: "Workspace" },
  },
  {
    name: "requirements",
    list: "/requirements",
    meta: { label: "Requirements", group: "Workspace" },
  },
  {
    name: "issues",
    list: "/issues",
    meta: { label: "Issues", group: "Workspace" },
  },

  // Site Personnel
  {
    name: "tasks",
    list: "/tasks",
    meta: { label: "Tasks", group: "Workspace" },
  },

  // Consultant (read-only advisory views)
  {
    name: "consultant-designs",
    list: "/consultant/designs",
    meta: { label: "Designs", group: "Overview" },
  },
  {
    name: "consultant-projects",
    list: "/consultant/projects",
    meta: { label: "Projects", group: "Overview" },
  },

  // Owner
  {
    name: "owner-portfolio",
    list: "/owner/portfolio",
    meta: { label: "Portfolio", group: "Executive" },
  },
  {
    name: "owner-proposals",
    list: "/owner/proposals",
    meta: { label: "Proposals", group: "Executive" },
  },
  {
    name: "owner-audit-trail",
    list: "/owner/audit-trail",
    meta: { label: "Audit Trail", group: "Oversight" },
  },
  {
    name: "owner-oversight",
    list: "/owner/oversight",
    meta: { label: "System Oversight", group: "Oversight" },
  },

  // IT Designer
  {
    name: "it-designer-users",
    list: "/it-designer/users",
    meta: { label: "User Accounts", group: "Administration" },
  },
  {
    name: "it-designer-proposals",
    list: "/it-designer/proposals",
    meta: { label: "Proposals", group: "Monitoring" },
  },
  {
    name: "it-designer-roles-permissions",
    list: "/it-designer/roles-permissions",
    meta: { label: "Roles & Permissions", group: "Administration" },
  },
  {
    name: "it-designer-activity-logs",
    list: "/it-designer/activity-logs",
    meta: { label: "Activity Logs", group: "Monitoring" },
  },
  {
    name: "it-designer-security",
    list: "/it-designer/security",
    meta: { label: "Security", group: "Monitoring" },
  },
  {
    name: "it-designer-support",
    list: "/it-designer/support",
    meta: { label: "User Support", group: "Support" },
  },

  // Admin
  {
    name: "admin-projects",
    list: "/admin/projects",
    meta: { label: "Projects", group: "Operations" },
  },
  {
    name: "admin-workflows",
    list: "/admin/workflows",
    meta: { label: "Workflows", group: "Operations" },
  },
  {
    name: "admin-documents",
    list: "/admin/documents",
    meta: { label: "Documents", group: "Operations" },
  },
  {
    name: "admin-activity-logs",
    list: "/admin/activity-logs",
    meta: { label: "Activity Logs", group: "Monitoring" },
  },
  {
    name: "admin-security",
    list: "/admin/security",
    meta: { label: "Security", group: "Monitoring" },
  },
  {
    name: "admin-notifications",
    list: "/admin/notifications",
    meta: { label: "Notifications", group: "Monitoring" },
  },
  {
    name: "admin-roles-permissions",
    list: "/admin/roles-permissions",
    meta: { label: "Roles & Permissions", group: "Configuration" },
  },
  {
    name: "admin-workflow-configuration",
    list: "/admin/workflow-configuration",
    meta: { label: "Workflow Configuration", group: "Configuration" },
  },
  {
    name: "admin-approval-hierarchy",
    list: "/admin/approval-hierarchy",
    meta: { label: "Approval Hierarchy", group: "Configuration" },
  },
  {
    name: "admin-support",
    list: "/admin/support",
    meta: { label: "User Support", group: "Support" },
  },

  // Intelligence — shared across roles
  {
    name: "ai-insights",
    list: "/ai-insights",
    meta: { label: "AI Insights", group: "Intelligence" },
  },
  {
    name: "reports",
    list: "/reports",
    meta: { label: "Reports", group: "Intelligence" },
  },
  {
    name: "resources",
    list: "/resources",
    meta: { label: "Resources", group: "Intelligence" },
  },
];
