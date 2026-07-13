import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { MOCK_IDENTITY } from "@/config/mock-role";
import { RESOURCE_ICONS } from "@/config/resource-icons";
import { ROLE_RESOURCE_ACCESS } from "@/config/role-resources";
import { useRoleConfig } from "@/hooks/use-role-config";
import { cn } from "@/lib/utils";
import { useMenu, useParsed, type TreeMenuItem } from "@refinedev/core";
import { ListIcon } from "lucide-react";
import { useNavigate } from "react-router";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SECTION_ORDER = ["Workspace", "Intelligence"];

function groupMenuItems(items: TreeMenuItem[]) {
  const role = MOCK_IDENTITY.role;
  const allowed = ROLE_RESOURCE_ACCESS[role] ?? [];

  // ✅ Filter out resources not allowed for this role
  const filtered = items.filter((item) => allowed.includes(item.name));

  const groups: Record<string, TreeMenuItem[]> = {};

  filtered.forEach((item) => {
    const group = (item.meta?.group as string) ?? "Workspace";
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  });

  const ordered = SECTION_ORDER.filter((g) => groups[g]);
  const extras = Object.keys(groups).filter((g) => !SECTION_ORDER.includes(g));

  return [...ordered, ...extras].map((label) => ({
    label,
    items: groups[label] ?? [],
  }));
}

function getIcon(item: TreeMenuItem) {
  const Mapped = RESOURCE_ICONS[item.name];
  return Mapped ?? ListIcon;
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const { menuItems, selectedKey } = useMenu();
  const { pathname } = useParsed();
  const navigate = useNavigate();
  const { identity, config } = useRoleConfig();
  const AvatarIcon = config.icon;

  const sections = groupMenuItems(menuItems);

  const isActive = (route: string) => {
    if (!pathname) return false;
    return (
      pathname === route ||
      (route !== "/" && pathname.startsWith(route + "/"))
    );
  };

  return (
    <ShadcnSidebar collapsible="icon" className={cn("border-r", "border-border")}>
      <SidebarRail />

      {/* ── Header ── */}
      <SidebarHeader
        className={cn(
          "h-16",
          "border-b",
          "border-border",
          "flex",
          "items-center",
          "justify-between",
          "px-3",
        )}
      >
        <AppSidebarHeader />
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = getIcon(item);
                  const active = isActive(item.route ?? "");

                  return (
                    <SidebarMenuItem key={item.key || item.name}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.meta?.label ?? item.label ?? item.name}
                        onClick={() => navigate(item.route ?? "/")}
                        className={cn(
                          "cursor-pointer",
                          "w-full",
                          {
                            // active state matches the green fill in the screenshot
                            "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground":
                              active,
                          },
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.meta?.label ?? item.label ?? item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer — user identity ── */}
      <SidebarFooter className={cn("border-t", "border-border")}>
        <div className={cn("flex", "items-center", "gap-2.5", "px-2", "py-3")}>
          {/* Avatar */}
          <div
            className={cn(
              "flex",
              "h-8",
              "w-8",
              "shrink-0",
              "items-center",
              "justify-center",
              "rounded-lg",
              "text-white",
              "text-xs",
              "font-semibold",
              config.avatarColor,
            )}
          >
            <AvatarIcon className="h-4 w-4" />
          </div>

          {/* Name + workspace label — hidden when collapsed */}
          <div
            className={cn(
              "flex",
              "min-w-0",
              "flex-col",
              "leading-tight",
              "group-data-[collapsible=icon]:hidden", // ✅ Shadcn built-in collapse helper
            )}
          >
            <span className="truncate text-sm font-medium text-foreground">
              {identity.name}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {config.label} workspace
            </span>
          </div>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}

// ── Sidebar Header — app title + collapse trigger ─────────────────────────────

function AppSidebarHeader() {
  const { open, isMobile } = useSidebar();
  const { config } = useRoleConfig();
  const AvatarIcon = config.icon;

  return (
    <div className={cn("flex", "w-full", "items-center", "justify-between")}>
      {/* Left: avatar + role name */}
      <div className={cn("flex", "items-center", "gap-2", "min-w-0")}>
        <div
          className={cn(
            "flex",
            "shrink-0",
            "items-center",
            "justify-center",
            "rounded-lg",
            "text-white",
            "transition-all",
            "duration-200",
            config.avatarColor,
            { "h-8 w-8": open, "h-7 w-7": !open },
          )}
        >
          <AvatarIcon className="h-4 w-4" />
        </div>

        <div
          className={cn(
            "flex",
            "min-w-0",
            "flex-col",
            "transition-all",
            "duration-200",
            "group-data-[collapsible=icon]:hidden",
          )}
        >
          <span className="truncate text-sm font-semibold text-foreground leading-tight">
            {config.label}
          </span>
          <span className="truncate text-[11px] text-orange-500 font-medium leading-tight">
            Construction Operations
          </span>
        </div>
      </div>
    </div>
  );
}

Sidebar.displayName = "Sidebar";