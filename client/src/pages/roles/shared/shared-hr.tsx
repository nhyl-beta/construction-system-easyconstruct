import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ToneBg } from "@/providers/mock-data";
import { CheckCircle2, type LucideIcon } from "lucide-react";

export function toneBg(tone: ToneBg) {
  switch (tone) {
    case "success":
      return "bg-success/10 text-success";
    case "warning":
      return "bg-warning/15 text-warning";
    case "destructive":
      return "bg-destructive/10 text-destructive";
    case "info":
      return "bg-info/10 text-info";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/10 text-success border-success/20",
    "On Leave": "bg-warning/15 text-warning border-warning/30",
    Suspended: "bg-destructive/10 text-destructive border-destructive/20",
    Archived: "bg-muted text-muted-foreground border-border",
    Verified: "bg-success/10 text-success border-success/20",
    Pending: "bg-warning/15 text-warning border-warning/30",
    Flagged: "bg-destructive/10 text-destructive border-destructive/20",
    Approved: "bg-success/10 text-success border-success/20",
    Review: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge
      variant="outline"
      className={`rounded-full text-[10px] ${map[status] ?? ""}`}
    >
      {status}
    </Badge>
  );
}

export function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${dot}`} />
      <span>{label}</span>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : "text-destructive";
  return (
    <div className="rounded-lg border bg-muted/20 p-2">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function KpiMini({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive" | "info";
  icon: LucideIcon;
}) {
  const bg =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
      ? "bg-warning/15 text-warning"
      : tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : "bg-info/10 text-info";
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-3 text-xl font-semibold tracking-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export function Checkpoint({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
          done
            ? "border-success bg-success/15 text-success"
            : "border-border text-muted-foreground"
        }`}
      >
        {done && <CheckCircle2 className="h-3 w-3" />}
      </div>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

export function Capacity({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "primary" | "info" | "warning";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const bg =
    tone === "primary"
      ? "bg-primary"
      : tone === "info"
      ? "bg-info"
      : "bg-warning";
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${bg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
