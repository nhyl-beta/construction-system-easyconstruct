// NOTE: "super-admin" is intentionally absent — the role was merged into
// "it-designer". Any token still carrying it falls through toFrontendRole()
// unchanged and lands on the default role config.
export const BACKEND_TO_FRONTEND_ROLE: Record<string, string> = {
  admin: "admin",
  owner: "owner",
  "it-designer": "it_designer",
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
