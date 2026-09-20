import {
  BadgeCheck,
  Layers,
  type LucideIcon,
  NotepadTextDashed,
  Plus,
  SquarePen,
  UserPlus,
} from "lucide-react";

import {
  ActivitySquare,
  BarChart2,
  Bell,
  CheckSquare,
  ClipboardList,
  Crown,
  DollarSign,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Ruler,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";

export type RoleTab = {
  label: string;
  icon: LucideIcon;
  route: string;
};

export type SidebarSection = {
  label: string;
  items: RoleTab[];
};

export type RoleConfig = {
  label: string;
  initials: string;
  subtitle: string;
  icon: LucideIcon;
  avatarColor: string;
  accentBg: string;
  searchPlaceholder: string;
  primaryAi: string;
  primaryAction: {
    label: string;
    icon: LucideIcon;
    route?: string;
  };
  tabs: RoleTab[];
  sections: SidebarSection[];
};

// NOTE: there is no `super_admin` entry — that role was merged into
// `it_designer`, which now carries its platform-administration scope on
// top of its own user/system administration.
export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  admin: {
    label: "Admin",
    initials: "AD",
    subtitle: "System administration",
    icon: UserCheck,
    avatarColor: "bg-slate-700",
    accentBg: "bg-slate-600",
    searchPlaceholder: "Search projects, workflows, activity...",
    primaryAi: "Operations Intelligence",
    primaryAction: { label: "New Workflow", icon: GitBranch, route: "/admin/workflows" },

    tabs: [
      { label: "Projects", icon: FolderKanban, route: "/admin/projects" },
      { label: "Workflows", icon: GitBranch, route: "/admin/workflows" },
      { label: "Documents", icon: FileText, route: "/admin/documents" },
      { label: "Activity Logs", icon: ShieldCheck, route: "/admin/activity-logs" },
    ],

    sections: [
      {
        label: "Operations",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Projects", icon: FolderKanban, route: "/admin/projects" },
          { label: "Workflows", icon: GitBranch, route: "/admin/workflows" },
          { label: "Documents", icon: FileText, route: "/admin/documents" },
        ],
      },
      {
        label: "Monitoring",
        items: [
          { label: "Activity Logs", icon: ShieldCheck, route: "/admin/activity-logs" },
          { label: "Security", icon: ShieldAlert, route: "/admin/security" },
          { label: "Notifications", icon: Bell, route: "/admin/notifications" },
        ],
      },
      {
        label: "Configuration",
        items: [
          { label: "Roles & Permissions", icon: UserCheck, route: "/admin/roles-permissions" },
          { label: "Workflow Configuration", icon: GitBranch, route: "/admin/workflow-configuration" },
          { label: "Approval Hierarchy", icon: CheckSquare, route: "/admin/approval-hierarchy" },
        ],
      },
      {
        label: "Support",
        items: [{ label: "User Support", icon: LifeBuoy, route: "/admin/support" }],
      },
    ],
  },
  // Owner is admin-adjacent but read-only: the executive sees everything the
  // organization is doing and nothing that changes it, so the Configuration
  // and Support sections Super Admin carries are deliberately absent.
  owner: {
    label: "Owner",
    initials: "OW",
    subtitle: "Executive oversight",
    icon: Crown,
    avatarColor: "bg-amber-700",
    accentBg: "bg-amber-600",
    searchPlaceholder: "Search projects, activity...",
    primaryAi: "Executive Intelligence",
    primaryAction: { label: "Audit Trail", icon: ShieldCheck, route: "/owner/audit-trail" },

    tabs: [
      { label: "Portfolio", icon: FolderKanban, route: "/owner/portfolio" },
      { label: "Proposals", icon: FileText, route: "/owner/proposals" },
      { label: "Audit Trail", icon: ShieldCheck, route: "/owner/audit-trail" },
      { label: "Oversight", icon: ShieldAlert, route: "/owner/oversight" },
    ],

    sections: [
      {
        label: "Executive",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Portfolio", icon: FolderKanban, route: "/owner/portfolio" },
          { label: "Proposals", icon: FileText, route: "/owner/proposals" },
        ],
      },
      {
        label: "Oversight",
        items: [
          { label: "Audit Trail", icon: ShieldCheck, route: "/owner/audit-trail" },
          { label: "System Oversight", icon: ShieldAlert, route: "/owner/oversight" },
        ],
      },
      {
        label: "Intelligence",
        items: [
          { label: "AI Insights", icon: ActivitySquare, route: "/ai-insights" },
          { label: "Reports", icon: BarChart2, route: "/reports" },
        ],
      },
    ],
  },
  // IT Designer is Admin scoped to system/user administration: it keeps the
  // Monitoring and Configuration halves of the Admin sidebar and drops the
  // Operations half (projects, workflows, documents) entirely.
  it_designer: {
    label: "IT Designer",
    initials: "IT",
    subtitle: "System administration",
    icon: Server,
    avatarColor: "bg-indigo-700",
    accentBg: "bg-indigo-600",
    searchPlaceholder: "Search users, activity...",
    primaryAi: "System Intelligence",
    primaryAction: { label: "New User", icon: UserPlus, route: "/it-designer/users" },

    tabs: [
      { label: "Users", icon: UsersRound, route: "/it-designer/users" },
      { label: "Proposals", icon: FileText, route: "/it-designer/proposals" },
      { label: "Activity Logs", icon: ShieldCheck, route: "/it-designer/activity-logs" },
      { label: "Security", icon: ShieldAlert, route: "/it-designer/security" },
    ],

    sections: [
      {
        label: "Administration",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "User Accounts", icon: UsersRound, route: "/it-designer/users" },
          { label: "Roles & Permissions", icon: UserCheck, route: "/it-designer/roles-permissions" },
        ],
      },
      // Absorbed from the former Super Admin role: platform administration
      // over projects, workflows and documents, plus system configuration.
      {
        label: "Operations",
        items: [
          { label: "Projects", icon: FolderKanban, route: "/admin/projects" },
          { label: "Workflows", icon: GitBranch, route: "/admin/workflows" },
          { label: "Documents", icon: FileText, route: "/admin/documents" },
        ],
      },
      {
        label: "Configuration",
        items: [
          { label: "Workflow Configuration", icon: GitBranch, route: "/admin/workflow-configuration" },
          { label: "Approval Hierarchy", icon: CheckSquare, route: "/admin/approval-hierarchy" },
        ],
      },
      {
        label: "Monitoring",
        items: [
          { label: "Proposals", icon: FileText, route: "/it-designer/proposals" },
          { label: "Activity Logs", icon: ShieldCheck, route: "/it-designer/activity-logs" },
          { label: "Security", icon: ShieldAlert, route: "/it-designer/security" },
        ],
      },
      {
        label: "Support",
        items: [{ label: "User Support", icon: LifeBuoy, route: "/it-designer/support" }],
      },
    ],
  },
  project_manager: {
    label: "Project Manager",
    initials: "PM",
    subtitle: "Portfolio overview",
    icon: FolderKanban,
    avatarColor: "bg-emerald-600",
    accentBg: "bg-emerald-500",
    searchPlaceholder: "Search projects, workflows...",
    primaryAi: "Proposal Validation",
    primaryAction: { label: "New Project", icon: Plus, route: "/projects/new" },

    tabs: [
      { label: "Projects", icon: FolderKanban, route: "/projects" },
      { label: "Workflows", icon: GitBranch, route: "/workflows" },
      { label: "Approvals", icon: CheckSquare, route: "/approvals" },
      { label: "Tasks", icon: CheckSquare, route: "/tasks" },
      { label: "Documents", icon: FileText, route: "/documents" },
    ],

    sections: [
      {
        label: "Workspace",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Projects", icon: FolderKanban, route: "/projects" },
          { label: "Workflows", icon: GitBranch, route: "/workflows" },
          { label: "Approvals", icon: CheckSquare, route: "/approvals" },
          { label: "Tasks", icon: CheckSquare, route: "/tasks" },
          { label: "Documents", icon: FileText, route: "/documents" },
        ],
      },
      {
        label: "Intelligence",
        items: [
          { label: "AI Insights", icon: ActivitySquare, route: "/ai-insights" },
          { label: "Resources", icon: Wrench, route: "/resources" },
          { label: "Reports", icon: BarChart2, route: "/reports" },
        ],
      },
    ],
  },

  human_resources: {
    label: "Human Resources",
    initials: "HR",
    subtitle: "Workforce management",
    icon: Users,
    avatarColor: "bg-blue-600",
    accentBg: "bg-blue-500",
    searchPlaceholder: "Search employees, attendance...",
    primaryAi: "Workforce Insights",
    primaryAction: {
      label: "Add Employee",
      icon: UserPlus,
      route: "/employees/new",
    },
    tabs: [
      { label: "Employees", icon: Users, route: "/employees" },
      { label: "Attendance", icon: UserCheck, route: "/attendance" },
      { label: "Payroll", icon: DollarSign, route: "/payroll" },
      { label: "Approvals", icon: CheckSquare, route: "/approvals" },
      { label: "Reports", icon: BarChart2, route: "/reports" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Approvals", icon: CheckSquare, route: "/approvals" },
        ],
      },
      {
        label: "People",
        items: [
          { label: "Employees", icon: UsersRound, route: "/employees" },
          { label: "Attendance", icon: UserCheck, route: "/attendance" },
          { label: "Documents", icon: FileText, route: "/documents" },
        ],
      },
      {
        label: "Payroll",
        items: [
          { label: "Payroll", icon: DollarSign, route: "/payroll" },
          { label: "Workforce Reports", icon: BarChart2, route: "/workforce-reports" },
        ],
      },
    ],
  },

  finance_manager: {
    label: "Finance Manager",
    initials: "FM",
    subtitle: "Financial overview",
    icon: DollarSign,
    avatarColor: "bg-amber-600",
    accentBg: "bg-amber-500",
    searchPlaceholder: "Search budgets, payroll sheets...",
    primaryAi: "Impact Awareness",
    primaryAction: {
      label: "New Budget",
      icon: Plus,
      route: "/budget",
    },
    tabs: [
      { label: "Budget", icon: BarChart2, route: "/budget" },
      {
        label: "Payroll Review",
        icon: ClipboardList,
        route: "/payroll-review",
      },
      { label: "Expenses", icon: ActivitySquare, route: "/expenses" },
      { label: "Approvals", icon: CheckSquare, route: "/approvals" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
        ],
      },
      {
        label: "Budget Management",
        items: [
          { label: "Budget Overview", icon: BarChart2, route: "/budget" },
          { label: "Expenses", icon: ActivitySquare, route: "/expenses" },
        ],
      },
      {
        label: "Approvals",
        items: [
          { label: "Payroll Review", icon: ClipboardList, route: "/payroll-review" },
          { label: "Approvals", icon: CheckSquare, route: "/approvals" },
        ],
      },
    ],
  },

  architect: {
    label: "Architect",
    initials: "AR",
    subtitle: "Design & proposals",
    icon: Ruler,
    avatarColor: "bg-pink-600",
    accentBg: "bg-pink-500",
    searchPlaceholder: "Search designs, proposals...",
    primaryAi: "AI Validation",
    primaryAction: {
      label: "Upload Design",
      icon: Plus,
    },
    tabs: [
      { label: "Projects", icon: FolderKanban, route: "/projects" },
      { label: "Designs", icon: Ruler, route: "/designs" },
      { label: "Proposals", icon: FileText, route: "/proposals" },
      {
        label: "AI Insights",
        icon: ActivitySquare,
        route: "/ai-insights",
      },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Designs", icon: Layers, route: "/designs" },
          { label: "Blueprints", icon: NotepadTextDashed, route: "/blueprints" },
        ],
      },

      {
        label: "Collaboration",
        items: [
          { label: "Approvals", icon: CheckSquare, route: "/approvals" },
          { label: "Reviews", icon: BadgeCheck, route: "/reviews" },
          { label: "Revisions", icon: SquarePen, route: "/revisions" },
          { label: "Documentation", icon: BarChart2, route: "/architect/documents" },
          { label: "AI Insights", icon: BarChart2, route: "/ai-insights" },
        ],
      },
    ],
  },

  engineer: {
    label: "Engineer",
    initials: "EN",
    subtitle: "Technical operations",
    icon: Wrench,
    avatarColor: "bg-cyan-600",
    accentBg: "bg-cyan-500",
    searchPlaceholder: "Search requirements, issues...",
    primaryAi: "Issue Resolution",
    primaryAction: {
      label: "Report Issue",
      icon: Plus,
    },

    tabs: [
      { label: "Progress", icon: BarChart2, route: "/progress" },
      { label: "Requirements", icon: ClipboardList, route: "/requirements" },
      { label: "Approvals", icon: CheckSquare, route: "/approvals" },
      { label: "Tasks", icon: CheckSquare, route: "/tasks" },
      { label: "Projects", icon: FolderKanban, route: "/projects" },
      { label: "Issues", icon: ActivitySquare, route: "/issues" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Progress & Site Reports", icon: Layers, route: "/progress" },
          {
            label: "Requirements",
            icon: NotepadTextDashed,
            route: "/requirements",
          },
          { label: "Approvals", icon: CheckSquare, route: "/approvals" },
        ],
      },

      {
        label: "Technical Operations",
        items: [
          { label: "Tasks", icon: CheckSquare, route: "/tasks" },
          { label: "Issues", icon: ActivitySquare, route: "/issues" },
          { label: "Projects", icon: FolderKanban, route: "/projects" },
          { label: "Documents", icon: FileText, route: "/documents" },
        ],
      },
    ],
  },

  site_personnel: {
    label: "Site Personnel",
    initials: "SP",
    subtitle: "Field operations",
    icon: MapPin,
    avatarColor: "bg-orange-600",
    accentBg: "bg-orange-500",
    searchPlaceholder: "Search tasks, field reports...",
    primaryAi: "Task Assistance",
    primaryAction: {
      label: "Log Attendance",
      icon: UserCheck,
    },
    tabs: [
      { label: "Attendance", icon: UserCheck, route: "/attendance" },
      { label: "Tasks", icon: CheckSquare, route: "/tasks" },
      { label: "Requirements", icon: ClipboardList, route: "/requirements" },
      { label: "Documents", icon: FileText, route: "/documents" },
      { label: "Issues", icon: ActivitySquare, route: "/issues" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Attendance", icon: UserCheck, route: "/attendance" },
          { label: "Tasks", icon: CheckSquare, route: "/tasks" },
          {
            label: "Requirements",
            icon: NotepadTextDashed,
            route: "/requirements",
          },
        ],
      },
      {
        label: "Operations",
        items: [
          { label: "Documents", icon: FileText, route: "/documents" },
          { label: "Issues", icon: ActivitySquare, route: "/issues" },
        ],
      },
    ],
  },

  consultant: {
    label: "Consultant",
    initials: "CO",
    subtitle: "Advisory access",
    icon: UserCheck,
    avatarColor: "bg-teal-600",
    accentBg: "bg-teal-500",
    searchPlaceholder: "Search proposals, advisory docs...",
    primaryAi: "Proposal Analysis",
    primaryAction: {
      label: "Upload Advisory",
      icon: Plus,
    },
      tabs: [
        { label: "Proposal Review", icon: FileText, route: "/consultant/proposals" },
        { label: "Designs", icon: Ruler, route: "/consultant/designs" },
        { label: "Advisory Docs", icon: ClipboardList, route: "/advisory-docs" },
        { label: "Approvals", icon: CheckSquare, route: "/approvals" },
        { label: "Projects", icon: FolderKanban, route: "/consultant/projects" },
      ],

        sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },       
          {
            label: "Proposal Review",
            icon: FileText,
            route: "/consultant/proposals"
          },
          { label: "Designs", icon: Ruler, route: "/consultant/designs" },
          { label: "Projects", icon: FolderKanban, route: "/consultant/projects" },
        ],
      },

      {
        label: "Output",
        items: [
          { label: "Approvals", icon: SquarePen, route: "/approvals" },
          { label: "Advisory Docs", icon: BarChart2, route: "/advisory-docs" },
          { label: "AI Insights", icon: BarChart2, route: "/ai-insights" },
          { label: "Reports", icon: BadgeCheck, route: "/reports" },
        ],
      },
    ],
  },
};

export const DEFAULT_ROLE_CONFIG: RoleConfig = {
  label: "User",
  initials: "U",
  subtitle: "General access",
  icon: LayoutDashboard,
  avatarColor: "bg-gray-600",
  accentBg: "bg-gray-500",
  searchPlaceholder: "Search...",
  primaryAi: "Assistant",
  primaryAction: {
    label: "Dashboard",
    icon: LayoutDashboard,
  },

  tabs: [{ label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" }],

  sections: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
      ],
    },

  ],
};
