export const BACKEND_TO_FRONTEND_ROLE: Record<string, string> = {
  "super-admin": "super_admin",
  admin: "admin",
  "human-resources": "human_resources",
  "finance-manager": "finance_manager",
  "project-manager": "project_manager",
  architect: "architect",
  engineer: "engineer",
  "site-personnel": "site_personnel",
  consultant: "consultant",
};

export function toFrontendRole(role: string) {
  return BACKEND_TO_FRONTEND_ROLE[role] ?? role;
}
