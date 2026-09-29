export type CalendarEventType = "milestone" | "submission" | "progress";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string; // ISO date (YYYY-MM-DD)
  title: string;
  projectCode: string;
  projectName: string;
  detail?: string;
}
