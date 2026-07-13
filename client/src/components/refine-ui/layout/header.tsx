import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useRoleConfig } from "@/hooks/use-role-config";
import { cn } from "@/lib/utils";
import {
  useActiveAuthProvider,
  useLogout,
  useParsed,
  useRefineOptions,
} from "@refinedev/core";
import { Bell, LogOutIcon, Search } from "lucide-react";
import { useNavigate } from "react-router";

export const Header = () => {
  const { isMobile } = useSidebar();
  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>;
};

function DesktopHeader() {
  const { open } = useSidebar();
  const { pathname } = useParsed();
  const navigate = useNavigate();
  const { identity, config } = useRoleConfig();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const ActionIcon = config.primaryAction.icon;

  const isTabActive = (route: string) => {
    if (!pathname) return false;
    return (
      pathname === route || (route !== "/" && pathname.startsWith(route + "/"))
    );
  };

  return (
    <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <header className="flex h-16 items-center gap-3 px-4 md:px-6">
        {/* ✅ Only renders + takes space when sidebar is collapsed */}
        <div
          className={cn(
            "flex items-center shrink-0 transition-all duration-200 overflow-hidden",
            {
              "w-auto opacity-100 mr-1": !open, // visible + separator gap when collapsed
              "w-0 opacity-0 mr-0": open, // zero width, no gap when expanded
            },
          )}
        >
          <SidebarTrigger className="text-muted-foreground" />
          <Separator orientation="vertical" className="ml-2 h-6" />
        </div>

        {/* Title block */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "hidden h-2 w-2 shrink-0 rounded-full md:inline-block",
                config.accentBg,
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight tracking-tight">
                {identity.name}'s workspace
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {config.subtitle} · {today}
              </p>
            </div>
            <Badge
              variant="outline"
              className="ml-1 hidden rounded-full border-border/60 text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:inline-flex"
            >
              {config.initials}
            </Badge>
          </div>

          <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={config.searchPlaceholder}
              className="h-9 rounded-xl border-border bg-muted/50 pl-9"
            />
          </div>
        </div>

        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button size="sm" className="rounded-xl">
          <ActionIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{config.primaryAction.label}</span>
        </Button>
        <UserDropdown />
      </header>

      <nav className="flex h-11 items-center gap-1 overflow-x-auto border-t bg-muted/30 px-4 md:px-6">
        {config.tabs.map((tab) => {
          const TabIcon = tab.icon;
          const active = isTabActive(tab.route);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.route)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3",
                "text-xs font-medium transition-all duration-150",
                active
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
        <span className="ml-auto hidden text-[11px] text-muted-foreground md:inline">
          AI · {config.primaryAi}
        </span>
      </nav>
    </div>
  );
}

function MobileHeader() {
  const { open, isMobile } = useSidebar();
  const { title } = useRefineOptions();

  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-12",
        "shrink-0",
        "items-center",
        "gap-2",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-between",
        "z-40",
      )}
    >
      <SidebarTrigger
        className={cn("text-muted-foreground", "rotate-180", "ml-1", {
          "opacity-0": open,
          "opacity-100": !open || isMobile,
          "pointer-events-auto": !open || isMobile,
          "pointer-events-none": open && !isMobile,
        })}
      />
      <div
        className={cn(
          "whitespace-nowrap",
          "flex",
          "flex-row",
          "h-full",
          "items-center",
          "justify-start",
          "gap-2",
          "transition-discrete",
          "duration-200",
          { "pl-3": !open, "pl-5": open },
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            "text-sm",
            "font-bold",
            "transition-opacity",
            "duration-200",
            { "opacity-0": !open, "opacity-100": open },
          )}
        >
          {title.text}
        </h2>
      </div>
      <ThemeToggle className={cn("h-8", "w-8")} />
    </header>
  );
}

const UserDropdown = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => logout()}>
          <LogOutIcon className={cn("text-destructive")} />
          <span className={cn("text-destructive")}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

Header.displayName = "Header";
MobileHeader.displayName = "MobileHeader";
DesktopHeader.displayName = "DesktopHeader";
