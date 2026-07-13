import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const ProjectsKpiStrip: React.FC<{ kpis: { total: number; onTrack: number; atRisk: number; delayed: number } }> = ({ kpis }) => {
  const items = [
    { label: "Active", value: String(kpis.total), tone: "text-foreground" },
    { label: "On track", value: String(kpis.onTrack), tone: "text-success" },
    { label: "At risk", value: String(kpis.atRisk), tone: "text-warning-foreground" },
    { label: "Delayed", value: String(kpis.delayed), tone: "text-destructive" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((s) => (
        <Card key={s.label} className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={`text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
