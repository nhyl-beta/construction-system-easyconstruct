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
          className="relative"
          aria-label={
            unread.length > 0
              ? `Notifications, ${unread.length} unread`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-strong px-1 text-overline font-semibold tabular-nums text-primary-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 rounded-2xl p-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-section-title font-semibold">Notifications</p>
          {unread.length > 0 && (
            <span className="text-caption text-muted-foreground">
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
            <p className="px-4 py-6 text-sm text-destructive-strong">
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
                className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left outline-none transition-colors duration-150 last:border-0 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:hover:bg-transparent"
              >
                {/* State dot: info for unread; read items carry none. */}
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    n.isRead ? "bg-transparent" : "bg-info"
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  {!n.isRead && <span className="sr-only">Unread. </span>}
                  <span
                    className={`block text-body leading-tight ${
                      n.isRead ? "font-medium" : "font-semibold"
                    }`}
                  >
                    {n.title}
                  </span>
                  {n.message && (
                    <span className="mt-0.5 block text-caption text-muted-foreground">
                      {n.message}
                    </span>
                  )}
                  <span className="mt-1 block text-right text-caption text-muted-foreground">
                    {formatRelativeTime(n.createdAt)}
                    {marking === n.id ? " · marking read…" : ""}
                  </span>
                </span>
              </button>
            ))}
        </ScrollArea>

        {!loading && !error && pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-overline text-muted-foreground">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
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
