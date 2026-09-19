// client/src/components/notifications/notification-bell.tsx
//
// The header bell used to be a bare <Button> with an icon and nothing behind
// it — no count, no list, no click handler. The data layer already existed
// (features/notifications + GET /api/notifications), it was simply never
// connected to the one place every role looks.
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/format-relative-time";

export function NotificationBell() {
  const { notifications, loading, error, marking, markRead, reload } =
    useNotifications();

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <Popover
      onOpenChange={(open) => {
        // Refetch on open so the list is current without polling.
        if (open) void reload();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl"
          aria-label={
            unread.length > 0
              ? `Notifications, ${unread.length} unread`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium tabular-nums text-primary-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          {unread.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {unread.length} unread
            </span>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {loading && (
            <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
          )}
          {!loading && error && (
            <p className="px-4 py-6 text-sm text-destructive">
              Couldn't load notifications. {error.message}
            </p>
          )}
          {!loading && !error && notifications.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Nothing to show yet.
            </p>
          )}
          {!loading &&
            !error &&
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                disabled={n.isRead || marking === n.id}
                onClick={() => void markRead(n.id)}
                className="flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    n.isRead ? "bg-muted-foreground/30" : "bg-primary"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">
                    {n.title}
                  </span>
                  {n.message && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {n.message}
                    </span>
                  )}
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatRelativeTime(n.createdAt)}
                    {marking === n.id ? " · marking read…" : ""}
                  </span>
                </span>
              </button>
            ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

NotificationBell.displayName = "NotificationBell";
