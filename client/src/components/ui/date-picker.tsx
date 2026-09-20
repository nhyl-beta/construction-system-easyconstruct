// client/src/components/ui/date-picker.tsx
//
// Every date field in the app was `<Input type="date">` — the browser's own
// control. That is not a design decision, it is the absence of one: it
// renders differently in every browser and OS, ignores the app's theme
// entirely (a dark-mode page gets a white system panel), and on Chrome hides
// the picker behind a tiny icon at the far end of the field. The styled
// Calendar component existed but its only consumer was an unused data-table
// filter, so no screen ever showed it.
//
// This is the designed replacement: the app's own Calendar in a Popover,
// behind a trigger that reads like the Inputs beside it. It speaks the same
// ISO `yyyy-MM-dd` strings the native input did, so it is a drop-in.
import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Display format in the trigger. ISO stays the wire format. */
const DISPLAY_FORMAT = "d MMM yyyy";

/**
 * `parseISO` on a date-only string yields local midnight, so formatting it
 * back cannot drift across the date line the way `new Date("2026-01-12")`
 * (parsed as UTC) does.
 */
function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

interface DatePickerProps {
  /** ISO `yyyy-MM-dd`, or "" when unset. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Hides the clear button where the field is required. */
  clearable?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a date",
  disabled = false,
  clearable = true,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  const commit = (date: Date | undefined) => {
    onChange(date ? format(date, "yyyy-MM-dd") : "");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          // Matches the Input the picker replaces: same height, same radius,
          // left-aligned value, muted placeholder.
          className={cn(
            "h-9 w-full justify-start rounded-xl px-3 font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={commit}
          initialFocus
        />
        <div className="flex items-center justify-between border-t border-border/70 p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={() => commit(new Date())}
          >
            Today
          </Button>
          {clearable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!selected}
              className="rounded-lg text-muted-foreground"
              onClick={() => commit(undefined)}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

DatePicker.displayName = "DatePicker";
