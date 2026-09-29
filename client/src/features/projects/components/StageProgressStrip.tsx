import React from "react";
import { Check } from "lucide-react";

import {
  PROJECT_PHASES,
  SEQUENCED_PHASES,
  type SequencedPhase,
} from "@/features/lifecycle/types/lifecycle.types";
import { Badge } from "@/components/ui/badge";
import { STATUS_TONE_CLASS } from "../constants/project-status";
import type { StatusTone } from "../types/project.types";

const isSequencedPhase = (status: string): status is SequencedPhase =>
  (SEQUENCED_PHASES as readonly string[]).includes(status);

/**
 * A1: at-a-glance stage progress for a project row. Completed sequenced
 * phases (before the current one) get a check; the current phase is bold;
 * phases after it stay muted. Statuses outside the sequenced path (On Hold,
 * Cancelled, or anything not in PROJECT_PHASES at all — "no stage set") fall
 * back to the plain status badge instead of a strip that can't place them.
 */
export const StageProgressStrip: React.FC<{
  status: string;
  statusTone: StatusTone;
}> = ({ status, statusTone }) => {
  if (!isSequencedPhase(status)) {
    return (
      <Badge
        variant="outline"
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE_CLASS[statusTone]}`}
      >
        {PROJECT_PHASES.includes(status as (typeof PROJECT_PHASES)[number])
          ? status
          : "No stage set"}
      </Badge>
    );
  }

  const currentIndex = SEQUENCED_PHASES.indexOf(status);

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {SEQUENCED_PHASES.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <span
            key={phase}
            title={phase}
            className={[
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-tight",
              isCompleted && "text-success",
              isCurrent && "font-semibold text-foreground",
              !isCompleted && !isCurrent && "text-muted-foreground/60",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isCompleted && <Check className="h-3 w-3" />}
            {phase}
          </span>
        );
      })}
    </div>
  );
};
