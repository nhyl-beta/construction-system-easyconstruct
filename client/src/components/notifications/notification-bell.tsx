// client/src/components/notifications/notification-bell.tsx
//
// The header bell used to be a bare <Button> with an icon and nothing behind
// it — no count, no list, no click handler. The data layer already existed
// (features/notifications + GET /api/notifications), it was simply never
// connected to the one place every role looks.
import { useState } from "react";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import type { Notification } from "@/features/notifications/types/notification.types";
import { formatRelativeTime } from "@/lib/format-relative-time";

// Q1: with enough notifications the list scrolled forever inside a tiny
// popover with no sense of how much further there was to go — paged in
// fixed slices instead, entirely client-side (the list is already fetched
// in full by useNotifications).
const PAGE_SIZE = 8;

export function NotificationBell() {
  const { notifications, loading, error, marking, markRead, reload } =
    useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  const unread = notifications.filter((n) => !n.isRead);
  const pageCount = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = notifications.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  // J3: mark read (if not already) and navigate to the notification's own
  // link — previously the button disabled itself once read, so a read
  // notification could never be clicked at all, let alone go anywhere.
  const handleSelect = (n: Notification) => {
    if (!n.isRead) void markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        // Refetch on open so the list is current without polling.
        if (nextOpen) {
          setPage(0);
          void reload();
        }
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

        {/* Radix's Viewport sizes itself via height:100%, which only
            resolves against a containing block with a *definite* height —
            max-height alone doesn't count (CSS spec). With max-h-80 here,
            the viewport fell back to auto/content height, silently
            overflowed past this box, and pushed the pagination row (the
            next sibling, laid out against this box's nominal edge) into
            the middle of the still-rendering item list. h-80 gives it a
            definite height so the overflow actually clips/scrolls. */}
        <ScrollArea className="h-80">
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
            pageItems.map((n) => (
              <button
                key={n.id}
                type="button"
                disabled={marking === n.id}
                onClick={() => handleSelect(n)}
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

        {!loading && !error && pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-border/70 px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

NotificationBell.displayName = "NotificationBell";
