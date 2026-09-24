import { useMemo, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/format-relative-time";

const TYPE_TONE: Record<string, string> = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-warning/15 text-warning border-warning/30",
  alert: "bg-destructive/10 text-destructive border-destructive/20",
  success: "bg-success/10 text-success border-success/20",
};

export default function AdminNotificationsPage() {
  const { notifications, loading, error, marking, markRead } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();

  const visible = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications),
    [notifications, filter],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description="Workflow, document, and operational alerts broadcast across every role."
      />
      <PageContent className="space-y-4 p-6 md:p-8">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList className="h-10 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread" className="rounded-lg">Unread ({unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading && <p className="text-sm text-muted-foreground">Loading notifications…</p>}
        {!loading && error && (
          <p className="text-sm text-destructive">Couldn't load notifications. {error.message}</p>
        )}
        {!loading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 px-6 py-12 text-center">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? "You're all caught up." : "No notifications yet."}
            </p>
          </div>
        )}
        {!loading && visible.length > 0 && (
          <div className="space-y-2">
            {visible.map((n) => (
              <div
                key={n.id}
                role={n.link ? "button" : undefined}
                tabIndex={n.link ? 0 : undefined}
                onClick={() => {
                  if (!n.isRead) void markRead(n.id);
                  if (n.link) navigate(n.link);
                }}
                className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${
                  n.link ? "cursor-pointer" : ""
                } ${n.isRead ? "border-border/70 bg-card" : "border-primary/30 bg-primary-soft/40"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-muted-foreground/30" : "bg-primary"}`} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <Badge variant="outline" className={`rounded-full text-[10px] capitalize ${TYPE_TONE[n.type] ?? ""}`}>
                        {n.type}
                      </Badge>
                      {n.role && (
                        <Badge variant="outline" className="rounded-full text-[10px] capitalize">
                          {n.role}
                        </Badge>
                      )}
                    </div>
                    {n.message && <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                </div>
                {!n.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 rounded-lg"
                    disabled={marking === n.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void markRead(n.id);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {marking === n.id ? "Saving…" : "Mark read"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}

AdminNotificationsPage.displayName = "AdminNotificationsPage";
