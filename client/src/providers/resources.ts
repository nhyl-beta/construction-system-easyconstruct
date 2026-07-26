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

  // Owner / IT Designer
  {
    name: "users",
    list: "/users",
    meta: { label: "User Accounts", group: "Workspace" },
  },
  {
    name: "audit-logs",
    list: "/audit-logs",
    meta: { label: "Audit Logs", group: "Workspace" },
  },
  {
    name: "monitoring",
    list: "/monitoring",
    meta: { label: "Monitoring", group: "Workspace" },
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
