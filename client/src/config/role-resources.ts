export const ROLE_RESOURCE_ACCESS: Record<string, string[]> = {
  owner: [
    "dashboard", "users", "audit-logs", "monitoring",
    "reports", "ai-insights",
  ],
  it_designer: [
    "dashboard", "users", "monitoring", "reports",
  ],
  project_manager: [
    "dashboard", "projects", "workflows", "approvals",
    "documents", "ai-insights", "resources", "reports",
  ],
  human_resources: [
    "dashboard", "employees", "attendance", "payroll", "reports",
  ],
  finance_manager: [
    "dashboard", "payroll-review", "budget", "impact-review",
    "approvals", "ai-insights", "reports",
  ],
  architect: [
    "dashboard", "designs", "proposals", "ai-insights", "projects",
  ],
  engineer: [
    "dashboard", "progress", "requirements", "issues",
    "projects", "ai-insights",
  ],
  site_personnel: [
    "dashboard", "attendance", "tasks", "documents", "issues",
  ],
  consultant: [
    "dashboard", "proposals", "documents", "approvals",
    "projects", "ai-insights",
  ],
};