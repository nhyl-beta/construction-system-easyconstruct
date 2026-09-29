// client/src/pages/roles/shared/shared-calendar.tsx — NEW (A2)
//
// One calendar page shared by every role (same convention as
// shared-reports.tsx), scoped server-side per role (see
// server/src/calendar/service.ts — same project-scoping rule as
// lifecycle/my-actions.ts). Shows three event kinds: milestone due dates,
// workflow submissions, and lifecycle phase transitions ("progress"),
// distinguished by color with a legend, in a month grid built from
// date-fns (already a project dependency — no new library).
import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flag, GitCommitHorizontal, Send } from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Button } from "@/components/ui/button";
import { useCalendarEvents } from "@/features/calendar/hooks/useCalendarEvents";
import type { CalendarEvent, CalendarEventType } from "@/features/calendar/types/calendar.types";

const EVENT_STYLE: Record<CalendarEventType, { label: string; dot: string; icon: typeof Flag }> = {
  milestone: { label: "Milestone", dot: "bg-primary", icon: Flag },
  submission: { label: "Submission", dot: "bg-warning", icon: Send },
  progress: { label: "Progress update", dot: "bg-success", icon: GitCommitHorizontal },
};

export default function SharedCalendarPage() {
  const { events, loading, error } = useCalendarEvents();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Milestones, workflow submissions, and progress updates for the projects you're on."
      />
      <PageContent className="space-y-4 p-6 md:p-8">
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error.message}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-32 text-center text-sm font-medium">{format(month, "MMMM yyyy")}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setMonth(startOfMonth(new Date()))}>
              Today
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {(Object.keys(EVENT_STYLE) as CalendarEventType[]).map((type) => (
              <span key={type} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${EVENT_STYLE[type].dot}`} />
                {EVENT_STYLE[type].label}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading calendar…</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <div className="grid grid-cols-7 border-b border-border/70 bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="px-2 py-2 text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate.get(key) ?? [];
                const inMonth = isSameMonth(day, month);
                const today = isSameDay(day, new Date());

                return (
                  <div
                    key={key}
                    className={`min-h-24 border-b border-r border-border/50 p-1.5 last:border-r-0 ${
                      inMonth ? "" : "bg-muted/20"
                    }`}
                  >
                    <div
                      className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        today ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          title={`${event.title} · ${event.projectName}${event.detail ? ` · ${event.detail}` : ""}`}
                          className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] leading-tight hover:bg-muted/60"
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${EVENT_STYLE[event.type].dot}`} />
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="px-1 text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}

SharedCalendarPage.displayName = "SharedCalendarPage";
