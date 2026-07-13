import {
  BadgeCheck,
  Layers,
  LucideIcon,
  NotepadTextDashed,
  Plus,
  SquarePen,
  UserPlus,
} from "lucide-react";

import {
  ActivitySquare,
  BarChart2,
  CheckSquare,
  ClipboardList,
  DollarSign,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  MapPin,
  Ruler,
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
  };
  tabs: RoleTab[];
  sections: SidebarSection[];
};

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  project_manager: {
    label: "Project Manager",
    initials: "PM",
    subtitle: "Portfolio overview",
    icon: FolderKanban,
    avatarColor: "bg-emerald-600",
    accentBg: "bg-emerald-500",
    searchPlaceholder: "Search projects, workflows...",
    primaryAi: "Proposal Validation",
    primaryAction: { label: "New Project", icon: Plus },

    tabs: [
      { label: "Projects", icon: FolderKanban, route: "/projects" },
      { label: "Workflows", icon: GitBranch, route: "/workflows" },
      { label: "Approvals", icon: CheckSquare, route: "/approvals" },
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
    },
    tabs: [
      { label: "Employees", icon: Users, route: "/employees" },
      { label: "Attendance", icon: UserCheck, route: "/attendance" },
      { label: "Payroll", icon: DollarSign, route: "/payroll" },
      { label: "Reports", icon: BarChart2, route: "/reports" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
        ],
      },
      {
        label: "People",
        items: [
          { label: "Employeees", icon: UsersRound, route: "/dashboard" },
          {
            label: "Employeee Profiles",
            icon: UsersRound,
            route: "/dashboard",
          },
          { label: "Documents", icon: UsersRound, route: "/dashboard" },
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
    },
    tabs: [
      {
        label: "Payroll Review",
        icon: ClipboardList,
        route: "/payroll-review",
      },
      { label: "Budget", icon: BarChart2, route: "/budget" },
      { label: "Impact Review", icon: ActivitySquare, route: "/impact-review" },
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
          {
            label: "Budget Overview",
            icon: BarChart2,
            route: "/budget-overview",
          },
          {
            label: "Budget Allocations",
            icon: BarChart2,
            route: "/budget-allocations",
          },
          {
            label: "Budget Adjustments",
            icon: BarChart2,
            route: "/budget-adjustments",
          },
          {
            label: "Budget History",
            icon: BarChart2,
            route: "/budget-history",
          },
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
      { label: "Designs", icon: Ruler, route: "/designs" },
      { label: "Proposals", icon: FileText, route: "/proposals" },
      {
        label: "AI Insights",
        icon: ActivitySquare,
        route: "/impact-awareness",
      },
      { label: "Projects", icon: FolderKanban, route: "/projects" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Designs", icon: Layers, route: "/dashboard" },
          { label: "Blueprints", icon: NotepadTextDashed, route: "/dashboard" },
        ],
      },

      {
        label: "Collaboration",
        items: [
          {
            label: "Reviews",
            icon: BadgeCheck,
            route: "/budget-overview",
          },
          {
            label: "Revisions",
            icon: SquarePen,
            route: "/budget-allocations",
          },
          {
            label: "Documentation",
            icon: BarChart2,
            route: "/budget-adjustments",
          },
          {
            label: "AI Function",
            icon: BarChart2,
            route: "/budget-history",
          },
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
      { label: "Issues", icon: ActivitySquare, route: "/issues" },
      { label: "Projects", icon: FolderKanban, route: "/projects" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Site Reports", icon: Layers, route: "/dashboard" },
          {
            label: "Inspections",
            icon: NotepadTextDashed,
            route: "/dashboard",
          },
        ],
      },

      {
        label: "Technical Operations",
        items: [
          {
            label: "Technical Reviews",
            icon: BadgeCheck,
            route: "/budget-overview",
          },
          {
            label: "Drawings",
            icon: SquarePen,
            route: "/budget-allocations",
          },
          {
            label: "Resources",
            icon: BarChart2,
            route: "/budget-adjustments",
          },
          {
            label: "AI Function",
            icon: BarChart2,
            route: "/budget-history",
          },
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
      { label: "Documents", icon: FileText, route: "/documents" },
      { label: "Issues", icon: ActivitySquare, route: "/issues" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Tasks", icon: Layers, route: "/dashboard" },
          { label: "Attendance", icon: NotepadTextDashed, route: "/dashboard" },
        ],
      },

      {
        label: "Technical Operations",
        items: [
          {
            label: "Daily Reports",
            icon: BadgeCheck,
            route: "/budget-overview",
          },
          {
            label: "Equipment",
            icon: SquarePen,
            route: "/budget-allocations",
          },
          {
            label: "Safety",
            icon: BarChart2,
            route: "/budget-adjustments",
          },
          {
            label: "AI Function",
            icon: BarChart2,
            route: "/budget-history",
          },
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
      { label: "Proposals", icon: FileText, route: "/proposals" },
      { label: "Documents", icon: ClipboardList, route: "/advisory-docs" },
      { label: "Approvals", icon: CheckSquare, route: "/approvals" },
      { label: "Projects", icon: FolderKanban, route: "/projects" },
    ],

    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
          { label: "Reviews", icon: Layers, route: "/dashboard" },
          {
            label: "Recommendations",
            icon: NotepadTextDashed,
            route: "/dashboard",
          },
        ],
      },

      {
        label: "Output",
        items: [
          {
            label: "Reports",
            icon: BadgeCheck,
            route: "/budget-overview",
          },
          {
            label: "Approvals",
            icon: SquarePen,
            route: "/budget-allocations",
          },
          {
            label: "Documents",
            icon: BarChart2,
            route: "/budget-adjustments",
          },
          {
            label: "AI Function",
            icon: BarChart2,
            route: "/budget-history",
          },
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

    {
      label: "Test Functions",
      items: [
        {
          label: "Reviews",
          icon: BadgeCheck,
          route: "/budget-overview",
        },
        {
          label: "Revisions",
          icon: SquarePen,
          route: "/budget-allocations",
        },
        {
          label: "Documentation",
          icon: BarChart2,
          route: "/budget-adjustments",
        },
        {
          label: "AI Function",
          icon: BarChart2,
          route: "/budget-history",
        },
      ],
    },
  ],
};
