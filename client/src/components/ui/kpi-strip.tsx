import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export type KpiTone = "good" | "warn" | "bad" | "neutral";

export interface KpiItem {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: KpiTone;
}

const toneText: Record<KpiTone, string> = {
  good: "text-success",
  warn: "text-warning-foreground",
  bad: "text-destructive",
  neutral: "text-foreground",
};

interface KpiStripProps {
  items: KpiItem[];
}

export function KpiStrip({ items }: KpiStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="rounded-2xl border-border/70 shadow-sm"
        >
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-semibold tracking-tight ${
                  toneText[item.tone ?? "neutral"]
                }`}
              >
                {item.value}
              </span>
            </div>
            {item.hint && (
              <div className="text-xs text-muted-foreground">{item.hint}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
